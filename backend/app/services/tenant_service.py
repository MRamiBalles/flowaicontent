"""
Tenant Service
Handles multi-tenancy and white-label configurations for Enterprise clients.
"""

import logging
import uuid
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class TenantService:
    def __init__(self):
        # Mock storage for tenants
        # In prod: Store in 'tenants' table in Postgres
        self.tenants = {
            "nike.flowai.com": {
                "id": "tenant_nike",
                "name": "Nike Studios",
                "config": {
                    "logo_url": "https://logo.clearbit.com/nike.com",
                    "primary_color": "#000000",
                    "font_family": "Futura",
                    "features": ["voice_cloning", "4k_export"]
                },
                "api_key": "sk_ent_nike_123"
            },
            "cocacola.flowai.com": {
                "id": "tenant_coke",
                "name": "Coca-Cola AI",
                "config": {
                    "logo_url": "https://logo.clearbit.com/coca-cola.com",
                    "primary_color": "#F40009",
                    "font_family": "Spencerian",
                    "features": ["collaborative_editing"]
                },
                "api_key": "sk_ent_coke_456"
            }
        }

    async def get_tenant_config(self, domain: str) -> Optional[Dict[str, Any]]:
        """Retrieve tenant configuration by domain."""
        # In prod: DB query
        return self.tenants.get(domain)

    async def create_tenant(self, name: str, domain: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new enterprise tenant."""
        if domain in self.tenants:
            raise ValueError("Domain already registered")
            
        tenant_id = f"tenant_{uuid.uuid4().hex[:8]}"
        api_key = f"sk_ent_{uuid.uuid4().hex[:16]}"
        
        new_tenant = {
            "id": tenant_id,
            "name": name,
            "config": config,
            "api_key": api_key
        }
        
        self.tenants[domain] = new_tenant
        logger.info(f"Created new tenant: {name} ({domain})")
        return new_tenant

    async def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate an Enterprise API key."""
        for tenant in self.tenants.values():
            if tenant["api_key"] == api_key:
                return tenant
        return None

# Global instance
tenant_service = TenantService()
