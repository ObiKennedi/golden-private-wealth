"use client";

import { Eye, EyeOff } from "lucide-react";
import { useBalanceVisibility } from "@/lib/useBalanceVisibility";

interface Props {
    totalIn: string;
    totalOut: string;
}

export function TxSummaryAmounts({ totalIn, totalOut }: Props) {
    const { visible, toggle } = useBalanceVisibility();

    return (
        <div className="txpage__summary" style={{ alignItems: "center" }}>
            <div className="txpage__summary-item">
                <span className="txpage__summary-label">Total In</span>
                <span className="txpage__summary-amount txpage__summary-amount--credit">
                    {visible ? `+${totalIn}` : "+********"}
                </span>
            </div>
            <div className="txpage__summary-divider" aria-hidden="true" />
            <div className="txpage__summary-item">
                <span className="txpage__summary-label">Total Out</span>
                <span className="txpage__summary-amount txpage__summary-amount--debit">
                    {visible ? `−${totalOut}` : "−********"}
                </span>
            </div>
        </div>
    );
}
