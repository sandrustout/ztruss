import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  IndianRupee, 
  TrendingUp, 
  AlertCircle, 
  Compass, 
  Utensils, 
  Car, 
  Hotel,
  ArrowRight
} from 'lucide-react';
import { TripItem } from '../../types';

interface CostPanelProps {
  tripId: string;
  items: TripItem[];
  budget?: number;
  currency: string;
}

export const CostPanel: React.FC<CostPanelProps> = ({
  tripId,
  items,
  budget,
  currency
}) => {
  const navigate = useNavigate();

  // Breakdown calculation
  let placesCost = 0;
  let foodCost = 0;
  let hotelCost = 0;
  let transitCost = 0;

  items.forEach(it => {
    const cost = it.cost_estimate || 0;
    if (it.type === 'place') placesCost += cost;
    else if (it.type === 'restaurant') foodCost += cost;
    else if (it.type === 'hotel') hotelCost += cost;
    else if (it.type === 'cab' || it.type === 'flight') transitCost += cost;
    else placesCost += cost;
  });

  const totalCost = placesCost + foodCost + hotelCost + transitCost;
  const budgetRatio = budget && budget > 0 ? (totalCost / budget) * 100 : 0;
  const isOverBudget = budget && budget > 0 && totalCost > budget;

  return (
    <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Cost Metrics */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[var(--primary)]" />
            <span className="font-semibold text-sm text-[var(--text)]">Estimated Total:</span>
            <span className="flex items-center font-bold text-base text-[var(--text)] tabular-nums">
              <IndianRupee className="w-4 h-4 text-[var(--primary)]" />
              {totalCost.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 border-l border-[var(--border)] pl-4">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Activities: ₹{placesCost.toLocaleString('en-IN')}</span>
            </span>
            <span className="flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5" />
              <span>Food: ₹{foodCost.toLocaleString('en-IN')}</span>
            </span>
            <span className="flex items-center gap-1">
              <Hotel className="w-3.5 h-3.5" />
              <span>Stays: ₹{hotelCost.toLocaleString('en-IN')}</span>
            </span>
          </div>

          {/* Budget Limit Comparison */}
          {budget && budget > 0 && (
            <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
              <span className="text-[11px] font-medium">Budget: ₹{budget.toLocaleString('en-IN')}</span>
              <div className="w-24 h-2 bg-[var(--bg)] border border-[var(--border)] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isOverBudget ? 'bg-red-600' : 'bg-[var(--primary)]'
                  }`}
                  style={{ width: `${Math.min(100, budgetRatio)}%` }}
                />
              </div>
              {isOverBudget && (
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  Over budget
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action: Estimate & View Itemised Bill */}
        <button
          onClick={() => navigate(`/trip/${tripId}/bill`)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[var(--primary)] text-[#FDFBD4] rounded-xl hover:bg-[var(--primary-strong)] transition-all shadow-xs shrink-0"
          title="Open complete destination invoice and itemised bill"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Estimate & View Bill</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
