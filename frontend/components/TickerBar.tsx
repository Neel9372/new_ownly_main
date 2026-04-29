'use client';

import { TICKER_ITEMS } from '@/lib/constants';

export default function TickerBar() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // Duplicate for seamless loop

  return (
    <div className="w-full overflow-hidden border-b"
         style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
      <div className="animate-ticker flex whitespace-nowrap py-2.5">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center mx-6 text-xs tracking-wide"
                style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="font-medium">{item.city}</span>
            <span className="mx-2" style={{ color: 'var(--gold)', opacity: 0.6 }}>·</span>
            <span>{item.value}</span>
            {i < items.length - 1 && (
              <span className="ml-6" style={{ color: 'var(--gold)', fontSize: '8px' }}>◆</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
