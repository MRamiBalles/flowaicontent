import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class LinearAttentionBlock(nn.Module):
    """
    Implementación de Atención Lineal eficiente (O(N)).
    Basada en 'Transformers are RNNs' (Katharopoulos et al., 2020) simplificado.
    """
    def __init__(self, d_model, n_heads, dropout=0.1):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.head_dim = d_model // n_heads
        
        self.q_proj = nn.Linear(d_model, d_model)
        self.k_proj = nn.Linear(d_model, d_model)
        self.v_proj = nn.Linear(d_model, d_model)
        self.out_proj = nn.Linear(d_model, d_model)
        
        self.dropout = nn.Dropout(dropout)
        self.feature_map = nn.ELU() # Feature map phi(x) = elu(x) + 1

    def forward(self, x, state=None):
        # x: [batch, seq_len, d_model]
        B, L, D = x.shape
        H = self.n_heads
        E = self.head_dim
        
        q = self.q_proj(x).view(B, L, H, E)
        k = self.k_proj(x).view(B, L, H, E)
        v = self.v_proj(x).view(B, L, H, E)
        
        # Feature map activation (ensure positivity)
        Q = self.feature_map(q) + 1.0
        K = self.feature_map(k) + 1.0
        
        # Linear Attention: Q * (K^T * V) instead of (Q * K^T) * V
        # Denominator: Q * (K^T * 1)
        
        # Efficient computation using einsum
        # KV: [B, H, E, E] - The "memory" state
        KV = torch.einsum("blhe,blhf->bhef", K, v)
        
        # Z: [B, H, E] - Normalizer state
        Z = K.sum(dim=1) 
        
        # Compute Output
        # Numerator: [B, L, H, E]
        out = torch.einsum("blhe,bhef->blhf", Q, KV)
        
        # Denominator: [B, L, H]
        denom = torch.einsum("blhe,bhe->blh", Q, Z)
        
        # Normalize
        out = out / (denom.unsqueeze(-1) + 1e-6)
        
        out = out.reshape(B, L, D)
        return self.out_proj(out)

class Expert(nn.Module):
    """Un experto individual (Feed Forward Network)."""
    def __init__(self, d_model, d_hidden, dropout=0.1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(d_model, d_hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_hidden, d_model),
            nn.Dropout(dropout)
        )

    def forward(self, x):
        return self.net(x)

class MoELayer(nn.Module):
    """
    Sparse Mixture-of-Experts Layer.
    Utiliza Top-K Gating ruidoso para enrutamiento.
    """
    def __init__(self, d_model, num_experts=4, k_active=2, d_hidden=None, dropout=0.1):
        super().__init__()
        self.num_experts = num_experts
        self.k_active = k_active
        d_hidden = d_hidden or d_model * 4
        
        self.gate = nn.Linear(d_model, num_experts)
        self.experts = nn.ModuleList([
            Expert(d_model, d_hidden, dropout) for _ in range(num_experts)
        ])

    def forward(self, x):
        # x: [batch, seq_len, d_model]
        batch_size, seq_len, d_model = x.shape
        x_flat = x.view(-1, d_model) # [batch*seq, d_model]
        
        # Gating scores
        gate_logits = self.gate(x_flat) # [batch*seq, num_experts]
        
        # Top-K selection
        weights, indices = torch.topk(gate_logits, self.k_active, dim=-1)
        weights = F.softmax(weights, dim=-1)
        
        # Prepare output container
        final_output = torch.zeros_like(x_flat)
        
        # Process each expert
        # Note: This is a naive sequential implementation. 
        # Optimized implementations use scatter/gather or specialized kernels.
        for i in range(self.num_experts):
            # Find inputs routed to this expert
            # mask: [batch*seq, k_active]
            mask = (indices == i)
            
            # batch_mask: [batch*seq] - True if this token uses expert i
            batch_mask = mask.any(dim=-1)
            
            if batch_mask.any():
                expert_input = x_flat[batch_mask]
                expert_output = self.experts[i](expert_input)
                
                # Add weighted contribution
                # We need to broadcast the weight correctly
                # weight_for_expert: [num_selected_tokens]
                
                # Find which rank (0 to k-1) this expert is for each selected token
                # This part is tricky in naive implementation, simplifying for clarity:
                # We iterate over k ranks
                for k in range(self.k_active):
                    # Tokens where this expert is the k-th choice
                    k_mask = (indices[:, k] == i)
                    if k_mask.any():
                        # Calculate contribution
                        k_input = x_flat[k_mask]
                        k_output = self.experts[i](k_input)
                        k_weight = weights[k_mask, k].unsqueeze(-1)
                        
                        # Add to final output (using index_add_ or simple addition with masking)
                        # Using simple masking for readability (less efficient)
                        final_output[k_mask] += k_output * k_weight
        
        return final_output.view(batch_size, seq_len, d_model)

class LargeReasoningModel(nn.Module):
    """
    LRM: Arquitectura Híbrida Linear Attention + MoE.
    """
    def __init__(self, vocab_size=32000, d_model=512, n_layers=6, n_heads=8, num_experts=4, k_active=2):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoder = nn.Parameter(torch.zeros(1, 1024, d_model)) # Simple learnable positional embedding
        
        self.layers = nn.ModuleList([])
        for _ in range(n_layers):
            self.layers.append(nn.ModuleDict({
                'attn': LinearAttentionBlock(d_model, n_heads),
                'norm1': nn.LayerNorm(d_model),
                'moe': MoELayer(d_model, num_experts, k_active),
                'norm2': nn.LayerNorm(d_model)
            }))
            
        self.head = nn.Linear(d_model, vocab_size)

    def forward(self, x):
        # x: [batch, seq_len]
        B, L = x.shape
        
        # Embeddings + Positional (truncated if needed)
        x = self.embedding(x) + self.pos_encoder[:, :L, :]
        
        for layer in self.layers:
            # Pre-Norm Architecture
            # 1. Linear Attention
            residual = x
            x = layer['norm1'](x)
            x = layer['attn'](x) + residual
            
            # 2. MoE Feed Forward
            residual = x
            x = layer['norm2'](x)
            x = layer['moe'](x) + residual
            
        return self.head(x)
