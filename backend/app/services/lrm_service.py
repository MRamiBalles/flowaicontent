import torch
from app.models.lrm import LargeReasoningModel
from app.core.config import settings

class LRMService:
    def __init__(self):
        self.device = torch.device(settings.MODEL_DEVICE)
        # Inicializar modelo con parámetros pequeños para desarrollo
        self.model = LargeReasoningModel(
            vocab_size=10000, # Vocabulario reducido para test
            d_model=256,
            n_layers=4,
            n_heads=4,
            num_experts=4,
            k_active=2
        ).to(self.device)
        self.model.eval()
        print("LRM Model initialized on", self.device)

    def process_context(self, text: str):
        """
        Procesa texto y devuelve embeddings o logits simulados.
        """
        # Tokenización simulada (simple split + hash mapping)
        tokens = [hash(w) % 10000 for w in text.split()]
        if not tokens:
            return {"status": "empty_input"}
            
        input_tensor = torch.tensor([tokens], dtype=torch.long).to(self.device)
        
        with torch.no_grad():
            output = self.model(input_tensor)
            
        return {
            "status": "success",
            "input_length": len(tokens),
            "output_shape": str(output.shape),
            "sample_logits": output[0, -1, :5].tolist() # Logits del último token
        }

# Singleton instance
lrm_service = LRMService()
