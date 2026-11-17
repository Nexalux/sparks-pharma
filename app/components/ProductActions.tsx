"use client";

import Link from "./SafeLink";
import { useState } from "react";
import { useSite } from "./SiteProvider";

export function ProductActions({ productSlug, productName }: { productSlug: string; productName: string }) {
  const { addItem } = useSite();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  function addToQuote() {
    addItem(productSlug, quantity, note.trim() || undefined, productName);
    setAdded(true);
  }

  return (
    <div className="product-actions">
      <div className="quantity-field">
        <label htmlFor="quantity">Trade quantity</label>
        <div>
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
          <input
            id="quantity"
            type="number"
            min="1"
            max="999"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(999, Number(event.target.value) || 1)))}
          />
          <button type="button" onClick={() => setQuantity((value) => Math.min(999, value + 1))} aria-label="Increase quantity">+</button>
        </div>
      </div>
      <label className="field">
        <span>Item note <small>Optional</small></span>
        <textarea
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Preferred pack quantity or trade question. Do not include patient details."
        />
      </label>
      <button className="primary-action action-full" type="button" onClick={addToQuote}>
        {added ? `${productName} added` : "Add to quote basket"} <span>{added ? "✓" : "→"}</span>
      </button>
      {added ? <Link className="secondary-action action-full" href="/quote">Review quote basket</Link> : null}
    </div>
  );
}
