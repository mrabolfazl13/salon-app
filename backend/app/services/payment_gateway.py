"""Payment Gateway Integration — ZarinPal/NextPay for production payments."""
import httpx
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.config import settings

logger = logging.getLogger(__name__)


class PaymentGatewayError(Exception):
    """Base exception for payment gateway errors."""
    pass


class ZarinPalGateway:
    """ZarinPal payment gateway integration.
    
    API Docs: https://docs.zarinpal.com/fa/
    Sandbox: https://sandbox.zarinpal.com
    """
    
    SANDBOX_BASE_URL = "https://sandbox.zarinpal.com/pg/rest/WebGate"
    PRODUCTION_BASE_URL = "https://www.zarinpal.com/pg/rest/WebGate"
    
    def __init__(self, merchant_id: str, sandbox: bool = True):
        self.merchant_id = merchant_id
        self.base_url = self.SANDBOX_BASE_URL if sandbox else self.PRODUCTION_BASE_URL
        self.sandbox = sandbox
    
    async def create_payment_request(
        self,
        amount: int,  # In Rials
        description: str,
        callback_url: str,
        email: Optional[str] = None,
        mobile: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a payment request and get authority code.
        
        Returns:
            {
                "Status": 100,  # Success
                "Authority": "000000000000000000000000000000000000",
                "FeeType": "Percent",
                "Fee": 1500
            }
        """
        payload = {
            "MerchantID": self.merchant_id,
            "Amount": amount,
            "Description": description,
            "CallbackURL": callback_url,
        }
        
        if email:
            payload["Email"] = email
        if mobile:
            payload["Mobile"] = mobile
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/PaymentRequest.json",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("Status") != 100:
                    raise PaymentGatewayError(
                        f"ZarinPal error: {result.get('Status')} - {result.get('Message', 'Unknown error')}"
                    )
                
                return {
                    "authority": result["Authority"],
                    "payment_url": f"https://{'sandbox' if self.sandbox else 'www'}.zarinpal.com/pg/StartPay/{result['Authority']}",
                    "fee": result.get("Fee", 0),
                }
        
        except httpx.HTTPError as e:
            logger.error(f"HTTP error creating ZarinPal payment: {e}")
            raise PaymentGatewayError(f"Failed to connect to ZarinPal: {e}")
        except Exception as e:
            logger.error(f"Unexpected error creating ZarinPal payment: {e}")
            raise PaymentGatewayError(f"Payment creation failed: {e}")
    
    async def verify_payment(
        self,
        authority: str,
        amount: int,
    ) -> Dict[str, Any]:
        """Verify a completed payment.
        
        Args:
            authority: The authority code from create_payment_request
            amount: The original payment amount
            
        Returns:
            {
                "Status": 100,
                "RefID": 1234567890,  # Reference ID
                "CardPan": "**** **** **** 1234",
                "Fee": 1500
            }
        """
        payload = {
            "MerchantID": self.merchant_id,
            "Authority": authority,
            "Amount": amount,
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/PaymentVerification.json",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("Status") != 100:
                    raise PaymentGatewayError(
                        f"ZarinPal verification failed: {result.get('Status')}"
                    )
                
                return {
                    "ref_id": result.get("RefID"),
                    "card_pan": result.get("CardPan", ""),
                    "fee": result.get("Fee", 0),
                    "verified_at": datetime.now(timezone.utc).isoformat(),
                }
        
        except httpx.HTTPError as e:
            logger.error(f"HTTP error verifying ZarinPal payment: {e}")
            raise PaymentGatewayError(f"Failed to verify payment: {e}")
        except Exception as e:
            logger.error(f"Unexpected error verifying ZarinPal payment: {e}")
            raise PaymentGatewayError(f"Payment verification failed: {e}")
    
    async def refund_payment(
        self,
        authority: str,
        amount: int,
        description: str = "بازگشت وجه",
    ) -> Dict[str, Any]:
        """Refund a completed payment via ZarinPal API.
        
        Args:
            authority: The authority code from original payment
            amount: Amount to refund (in Rials)
            description: Reason for refund
            
        Returns:
            {
                "Status": 100,
                "RefID": 1234567890
            }
        """
        payload = {
            "MerchantID": self.merchant_id,
            "Authority": authority,
            "Amount": amount,
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/PaymentRefund.json",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("Status") != 100:
                    raise PaymentGatewayError(
                        f"ZarinPal refund failed: {result.get('Status')} - {result.get('Message', 'Unknown')}"
                    )
                
                return {
                    "ref_id": result.get("RefID"),
                    "status": "success",
                    "refunded_at": datetime.now(timezone.utc).isoformat(),
                }
        
        except httpx.HTTPError as e:
            logger.error(f"HTTP error refunding ZarinPal payment: {e}")
            raise PaymentGatewayError(f"Failed to refund payment: {e}")
        except Exception as e:
            logger.error(f"Unexpected error refunding ZarinPal payment: {e}")
            raise PaymentGatewayError(f"Refund failed: {e}")


class NextPayGateway:
    """NextPay payment gateway integration (alternative to ZarinPal).
    
    API Docs: https://nextpay.ir/docs
    """
    
    BASE_URL = "https://api.nextpay.ir/gateway/token/http"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def create_payment_request(
        self,
        amount: int,
        callback_url: str,
        order_id: str,
    ) -> Dict[str, Any]:
        """Create payment request with NextPay."""
        payload = {
            "api_key": self.api_key,
            "amount": amount,
            "callback_uri": callback_url,
            "order_id": order_id,
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.BASE_URL,
                    data=payload
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("code") != "-1":
                    raise PaymentGatewayError(
                        f"NextPay error: {result.get('code')} - {result.get('message', 'Unknown')}"
                    )
                
                return {
                    "authority": result["trans_id"],
                    "payment_url": f"https://nextpay.ir/nx/pay/{result['trans_id']}",
                }
        
        except Exception as e:
            logger.error(f"NextPay payment creation failed: {e}")
            raise PaymentGatewayError(f"Payment creation failed: {e}")
    
    async def verify_payment(
        self,
        authority: str,
        amount: int,
    ) -> Dict[str, Any]:
        """Verify NextPay payment."""
        payload = {
            "api_key": self.api_key,
            "amount": amount,
            "trans_id": authority,
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/verify",
                    data=payload
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("code") != "0":
                    raise PaymentGatewayError(
                        f"NextPay verification failed: {result.get('code')}"
                    )
                
                return {
                    "ref_id": result.get("Shaparak_Ref_Id"),
                    "card_pan": "",
                    "verified_at": datetime.now(timezone.utc).isoformat(),
                }
        
        except Exception as e:
            logger.error(f"NextPay verification failed: {e}")
            raise PaymentGatewayError(f"Verification failed: {e}")


# Factory function to get the configured gateway
def get_payment_gateway() -> ZarinPalGateway:
    """Get configured payment gateway based on settings.
    
    Uses ZarinPal by default. Falls back to mock in development.
    """
    merchant_id = getattr(settings, 'ZARINPAL_MERCHANT_ID', None)
    sandbox = getattr(settings, 'ZARINPAL_SANDBOX', True)
    
    if not merchant_id:
        # No merchant ID configured - use mock mode
        logger.warning("ZARINPAL_MERCHANT_ID not configured - using mock gateway")
        return None
    
    return ZarinPalGateway(merchant_id=merchant_id, sandbox=sandbox)
