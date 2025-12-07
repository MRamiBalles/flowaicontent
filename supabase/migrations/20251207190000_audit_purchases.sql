-- Create a function to log style pack purchases automatically
CREATE OR REPLACE FUNCTION public.log_style_pack_purchase()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (action, target_user_id, details)
  VALUES (
    'STYLE_PACK_PURCHASE',
    NEW.user_id,
    jsonb_build_object(
      'pack_id', NEW.pack_id,
      'price', NEW.amount,
      'currency', NEW.currency,
      'transaction_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_style_pack_purchase ON public.style_pack_purchases;
CREATE TRIGGER on_style_pack_purchase
  AFTER INSERT ON public.style_pack_purchases
  FOR EACH ROW EXECUTE FUNCTION public.log_style_pack_purchase();
