type PriceSummaryProps = {
  unitPrice: number;
  quantity: number;
  productLabel: string;
};

export function PriceSummary({ unitPrice, quantity, productLabel }: PriceSummaryProps) {
  const subtotal = unitPrice * quantity;
  const bundleSavings = productLabel.includes("Card") && quantity >= 4 ? unitPrice : 0;
  const familyPackSavings = quantity >= 3 ? Math.round(subtotal * 0.1) : 0;
  const totalSavings = Math.max(bundleSavings, familyPackSavings);
  const total = subtotal - totalSavings;

  return (
    <section className="rounded-2xl border border-charcoal/8 bg-white p-4 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]">
      <h3 className="text-lg font-black text-charcoal">Price summary</h3>
      <div className="mt-3 space-y-2 text-sm text-charcoal">
        <div className="flex justify-between"><span>Unit price</span><span>£{unitPrice}</span></div>
        <div className="flex justify-between"><span>Quantity</span><span>{quantity}</span></div>
        <div className="flex justify-between"><span>Subtotal</span><span>£{subtotal}</span></div>
        <div className="flex justify-between text-forest">
          <span>Bundle savings</span><span>-£{totalSavings}</span>
        </div>
      </div>
      <div className="mt-3 border-t border-black/10 pt-3 text-base font-black flex justify-between text-charcoal">
        <span>Total</span><span>£{total}</span>
      </div>
      <p className="mt-2 text-xs text-charcoal/55">Bundles: Buy 3 cards get 1 free. Family pack savings auto-applied.</p>
      <p className="mt-2 text-xs font-semibold text-charcoal/45">Every design is one-of-a-kind — made uniquely for the person you&apos;re gifting.</p>
    </section>
  );
}
