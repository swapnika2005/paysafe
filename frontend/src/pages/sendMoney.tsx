import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Lock,
  Search,
  Shield,
  Wallet,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { useWallet, useSendMoney } from "@/hooks/useWallet";
import { walletApi } from "@/api/endpoints/wallet.api";
import { formatIndianPhone } from "@/lib/formatters";

type Step = "recipient" | "amount" | "pin" | "processing" | "result";
type ResultType = "approved" | "blocked";

type Contact = {
  name: string;
  phone: string;
  avatar: string;
};

const PIN_ERROR_CODES = ["INVALID_PIN", "PIN_NOT_SET"];

function StepRecipient({
  phone,
  setPhone,
  note,
  setNote,
  receiverLoading,
  receiverFound,
  receiverName,
  receiverError,
  recentContacts,
  recentLoading,
  onNext,
  onSelectContact,
}: {
  phone: string;
  setPhone: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  receiverLoading: boolean;
  receiverFound: boolean;
  receiverName: string;
  receiverError: string;
  recentContacts: Contact[];
  recentLoading: boolean;
  onNext: () => void;
  onSelectContact: (c: Contact) => void;
}) {
  const [search] = useState("");
  const filtered = recentContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
          Recipient phone number
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/10 transition-all">
          <span className="text-sm font-semibold text-slate-500">+91</span>
          <div className="h-4 w-px bg-slate-200" />
          <input
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="3XX XXXXXXX"
            className="h-12 flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {phone && (
            <button
              onClick={() => setPhone("")}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {receiverLoading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Looking up account...
          </div>
        )}
        {receiverFound && receiverName && !receiverLoading && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-700">
              {receiverName}
            </p>
            <span className="ml-auto text-[10px] text-emerald-500">
              PaySafe verified ✓
            </span>
          </div>
        )}
        {receiverError && !receiverLoading && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <p className="text-xs font-semibold text-rose-600">
              {receiverError}
            </p>
          </div>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
          Note <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Rent payment, groceries..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
        />
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">
            Recent contacts
          </p>
        </div>
        {recentLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              >
                <div className="h-10 w-10 rounded-full animate-pulse bg-slate-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-2.5 w-32 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : recentContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-7 text-slate-400">
            <User className="h-7 w-7 mb-2 opacity-30" />
            <p className="text-xs font-semibold">No recent contacts yet</p>
            <p className="text-[11px] mt-0.5 text-slate-400">
              People you send to will appear here
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-5 text-slate-400">
            <Search className="h-5 w-5 mb-1.5 opacity-30" />
            <p className="text-xs font-medium">No contacts match "{search}"</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {filtered.map((c) => (
              <li key={c.phone}>
                <button
                  onClick={() => onSelectContact(c)}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${c.avatar} text-[11px] font-bold text-white shadow-sm`}
                  >
                    {c.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatIndianPhone(c.phone)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        onClick={onNext}
        disabled={phone.length < 10 || !receiverFound || receiverLoading}
        className="w-full h-12 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 text-sm font-semibold shadow-lg shadow-teal-600/25 transition hover:scale-[1.01] hover:shadow-teal-600/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Continue <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

function StepAmount({
  amount,
  setAmount,
  receiver,
  balance,
  balanceLoading,
  onNext,
  onBack,
}: {
  amount: string;
  setAmount: (v: string) => void;
  receiver: string;
  balance: number;
  balanceLoading: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  const num = parseFloat(amount) || 0;
  const valid = num > 0 && num <= balance;
  const PRESETS = [500, 1000, 2000, 5000];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-cyan-600 text-xs font-bold text-white shadow-sm">
          {receiver.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-xs text-slate-500">Sending to</p>
          <p className="text-sm font-semibold text-slate-800">{receiver}</p>
        </div>
        <button
          onClick={onBack}
          className="ml-auto text-xs font-semibold text-teal-600 hover:text-teal-700"
        >
          Change
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Amount (INR)
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-bold text-slate-400">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-48 bg-transparent text-center text-4xl font-black text-slate-900 placeholder:text-slate-200 focus:outline-none"
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Available:{" "}
          {balanceLoading ? (
            <span className="inline-block h-3 w-20 animate-pulse rounded bg-slate-200 align-middle" />
          ) : (
            <span className="font-semibold text-slate-700">
              ₹{balance.toLocaleString("en-IN")}
            </span>
          )}
        </p>
        {num > balance && (
          <p className="mt-1.5 flex items-center justify-center gap-1 text-xs font-semibold text-rose-500">
            <AlertTriangle className="h-3 w-3" /> Insufficient balance
          </p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(String(p))}
            className={`rounded-xl border py-2 text-sm font-semibold transition-all ${
              amount === String(p)
                ? "border-teal-400 bg-teal-50 text-teal-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/50"
            }`}
          >
            {p >= 1000 ? `${p / 1000}k` : p}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-[11px] font-medium text-emerald-700">
          Zero transfer fees · Amount received = amount sent
        </p>
      </div>
      <Button
        onClick={onNext}
        disabled={!valid}
        className="w-full h-12 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 text-sm font-semibold shadow-lg shadow-teal-600/25 transition hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Review transfer <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

function StepPin({
  phone,
  receiverName,
  amount,
  note,
  pin,
  setPin,
  pinVisible,
  setPinVisible,
  pinError,
  onConfirm,
  onBack,
  isSending,
}: {
  phone: string;
  receiverName: string;
  amount: string;
  note: string;
  pin: string;
  setPin: (v: string) => void;
  pinVisible: boolean;
  setPinVisible: (v: boolean) => void;
  pinError: string;
  onConfirm: () => void;
  onBack: () => void;
  isSending: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-linear-to-r from-teal-600 to-cyan-600 px-5 py-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-100">
            Transfer summary
          </p>
          <p className="mt-1 text-3xl font-black">
            ₹{parseFloat(amount).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="divide-y divide-slate-50 px-5">
          {[
            { label: "To", value: receiverName || phone },
            { label: "Phone", value: "+91 " + phone },
            {
              label: "Amount",
              value: "₹" + parseFloat(amount).toLocaleString("en-IN"),
            },
            { label: "Fee", value: "₹0 (Free)" },
            { label: "Note", value: note || "—" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2.5"
            >
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-sm font-semibold text-slate-800">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-teal-100 bg-teal-50 px-3 py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
        <p className="text-[11px] leading-relaxed text-teal-700">
          AI fraud analysis runs instantly before this transfer. If risk is
          detected, the transaction will be blocked automatically.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
          Enter your 4-digit transaction PIN
        </label>
        <div
          className={`flex items-center gap-2 rounded-xl border bg-slate-50 px-3 focus-within:bg-white focus-within:ring-2 transition-all
          ${
            pinError
              ? "border-rose-400 focus-within:border-rose-400 focus-within:ring-rose-500/10"
              : "border-slate-200 focus-within:border-teal-400 focus-within:ring-teal-500/10"
          }`}
        >
          <Lock
            className={`h-4 w-4 shrink-0 ${pinError ? "text-rose-400" : "text-slate-400"}`}
          />
          <input
            type={pinVisible ? "text" : "password"}
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="••••"
            className="h-12 flex-1 bg-transparent text-center text-xl font-bold tracking-[0.5em] text-slate-800 placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none"
          />
          <button
            onClick={() => setPinVisible(!pinVisible)}
            className="text-slate-400 hover:text-slate-600"
          >
            {pinVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {/* Inline PIN error — stays on this step, no navigation away */}
        {pinError && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
            <p className="text-xs font-semibold text-rose-600">{pinError}</p>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          disabled={isSending}
          variant="outline"
          className="h-12 flex-1 rounded-xl border-slate-200 text-sm font-semibold text-slate-700"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={pin.length < 4 || isSending}
          className="h-12 flex-2 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 text-sm font-semibold shadow-lg shadow-teal-600/25 transition hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending...
            </>
          ) : (
            <>
              Confirm & Send <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StepProcessing() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full border-4 border-teal-100" />
        <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-t-teal-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="h-8 w-8 text-teal-600" />
        </div>
      </div>
      <p className="text-base font-bold text-slate-900">
        Running AI fraud check...
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500">
        Analyzing transaction patterns and risk signals in real time.
      </p>
      <div className="mt-6 space-y-2 w-64">
        {[
          "Verifying recipient",
          "Checking transaction patterns",
          "Running ML fraud model",
        ].map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2"
          >
            <Loader2
              className="h-3.5 w-3.5 shrink-0 animate-spin text-teal-500"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
            <p className="text-xs text-slate-600">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepResult({
  type,
  amount,
  receiverName,
  riskScore,
  reasons,
  onDone,
  phone,
  note,
}: {
  type: ResultType;
  amount: string;
  receiverName: string;
  riskScore: number;
  reasons: string[];
  apiError?: string | null;
  onDone: () => void;
  phone: string;
  note: string;
}) {
  const approved = type === "approved";

  function downloadReceipt() {
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 800;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 480, 800);

    // Header
    ctx.fillStyle = approved ? "#0ea472" : "#e53e3e";
    ctx.fillRect(0, 0, 480, 180);

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(240, 62, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(approved ? "✓" : "✗", 240, 78);

    ctx.font = "500 20px sans-serif";
    ctx.fillText(
      approved ? "Transaction Successful" : "Transaction Blocked",
      240,
      122,
    );
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(
      approved ? "Money has been sent" : "Blocked by AI fraud detection",
      240,
      145,
    );

    const amt = `₹${parseFloat(amount).toLocaleString("en-IN")}`;
    const date = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const txnId = `TXN#SPY${Date.now()}`;

    ctx.fillStyle = "#111";
    ctx.font = "500 30px sans-serif";
    ctx.fillText(amt, 240, 215);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#888";
    ctx.fillText(date, 240, 237);
    ctx.fillStyle = "#bbb";
    ctx.font = "11px monospace";
    ctx.fillText(txnId, 240, 255);

    const rows = [
      ["Funding source", "PaySafe Wallet"],
      ["Sent to", receiverName || "+91 " + phone],
      ["Phone", "+91 " + phone],
      ["Amount", amt],
      ["Fee / Charge", "No Charge"],
      ["Note", note || "—"],
    ];

    let y = 290;
    rows.forEach(([label, value]) => {
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(32, y - 8);
      ctx.lineTo(448, y - 8);
      ctx.stroke();
      ctx.font = "500 13px sans-serif";
      ctx.fillStyle = "#666";
      ctx.textAlign = "left";
      ctx.fillText(label, 32, y + 8);
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#111";
      ctx.textAlign = "right";
      ctx.fillText(value, 448, y + 8);
      y += 40;
    });

    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(32, y - 8);
    ctx.lineTo(448, y - 8);
    ctx.stroke();
    ctx.font = "500 14px sans-serif";
    ctx.fillStyle = "#111";
    ctx.textAlign = "left";
    ctx.fillText("Total amount", 32, y + 10);
    ctx.fillStyle = approved ? "#0ea472" : "#e53e3e";
    ctx.textAlign = "right";
    ctx.fillText(amt, 448, y + 10);
    y += 50;

    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(32, y + 10);
    ctx.lineTo(448, y + 10);
    ctx.stroke();
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#bbb";
    ctx.textAlign = "center";
    ctx.fillText(
      "Powered by PaySafe · AI fraud protection active",
      240,
      y + 28,
    );

    const link = document.createElement("a");
    link.download = `paysafe-receipt-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm -m-6">
      {/* Header */}
      <div
        className={`px-6 py-8 text-center ${approved ? "bg-[#0ea472]" : "bg-rose-500"}`}
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
          {approved ? (
            <Check className="h-7 w-7 text-white" strokeWidth={3} />
          ) : (
            <X className="h-7 w-7 text-white" strokeWidth={3} />
          )}
        </div>
        <p className="text-xl font-semibold text-white">
          {approved ? "Transaction Successful" : "Transaction Blocked"}
        </p>
        <p className="mt-1 text-sm text-white/80">
          {approved ? "Money has been sent" : "Blocked by AI fraud detection"}
        </p>
      </div>

      {/* Amount */}
      <div className="border-b border-slate-100 px-6 py-5 text-center">
        <p className="text-3xl font-semibold text-slate-900">
          ₹{parseFloat(amount).toLocaleString("en-IN")}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {new Date().toLocaleString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-50 px-6">
        {[
          { label: "Funding source", value: "PaySafe Wallet" },
          { label: "Sent to", value: receiverName || "+91 " + phone },
          { label: "Phone", value: "+91 " + phone },
          {
            label: "Amount",
            value: `₹${parseFloat(amount).toLocaleString("en-IN")}`,
          },
          { label: "Fee / Charge", value: "No Charge" },
          { label: "Note", value: note || "—" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-3">
            <span className="text-xs font-medium text-slate-500">{label}</span>
            <span className="text-sm text-slate-800">{value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-semibold text-slate-900">
            Total amount
          </span>
          <span
            className={`text-sm font-semibold ${approved ? "text-[#0ea472]" : "text-rose-500"}`}
          >
            ₹{parseFloat(amount).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Risk score */}
      <div className="mx-6 mb-5 mt-1 rounded-xl bg-slate-50 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            AI risk score
          </span>
          <span
            className={`text-xs font-semibold ${riskScore < 30 ? "text-[#0ea472]" : riskScore < 70 ? "text-amber-600" : "text-rose-600"}`}
          >
            {riskScore}% —{" "}
            {riskScore < 30 ? "Safe" : riskScore < 70 ? "Medium" : "High risk"}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-700 ${riskScore < 30 ? "bg-[#0ea472]" : riskScore < 70 ? "bg-amber-500" : "bg-rose-500"}`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
        {!approved && reasons.length > 0 && (
          <ul className="mt-3 space-y-1">
            {reasons.map((r) => (
              <li
                key={r}
                className="flex items-start gap-1.5 text-[11px] text-rose-600"
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 px-6 pb-6">
        {approved && (
          <button
            onClick={downloadReceipt}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0ea472] py-3 text-sm font-semibold text-white transition hover:bg-[#0c9265]"
          >
            <Download className="h-4 w-4" /> Download Receipt
          </button>
        )}
        <div className="flex gap-2">
          <Link to="/history" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
            >
              View history
            </Button>
          </Link>
          <Button
            onClick={onDone}
            className="flex-1 h-11 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 text-sm font-semibold"
          >
            Send again
          </Button>
        </div>
      </div>

      <div className="border-t border-slate-50 py-3 text-center">
        <p className="text-[11px] text-slate-400">
          Powered by{" "}
          <span className="font-medium text-slate-500">PaySafe</span> ·
          AI fraud protection active
        </p>
      </div>
    </div>
  );
}

export function SendMoney() {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const sendMoneyMutation = useSendMoney();

  const [step, setStep] = useState<Step>("recipient");
  const [phone, setPhone] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [pinError, setPinError] = useState("");

  const [receiverLoading, setReceiverLoading] = useState(false);
  const [receiverFound, setReceiverFound] = useState(false);
  const [receiverError, setReceiverError] = useState("");

  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const [resultType, setResultType] = useState<ResultType>("approved");
  const [riskScore, setRiskScore] = useState(0);
  const [riskReasons, setRiskReasons] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const BALANCE: number = (wallet as any)?.balance ?? 0;

  useEffect(() => {
    setRecentLoading(true);
    walletApi
      .getRecentContacts()
      .then((res: any) => {
        const contacts = res.data?.data ?? [];

        // Normalize current user's phone so we can exclude it from the list
        const myPhoneRaw =
          (wallet as any)?.phone ??
          (wallet as any)?.user?.phone ??
          (wallet as any)?.owner?.phone ??
          "";
        const normalize = (p: string) =>
          (p ?? "").replace(/\D/g, "").replace(/^91/, "");
        const myPhone = normalize(myPhoneRaw);

        const filtered = contacts.filter((u: any) => {
          const cPhone = normalize(u.phone);
          return cPhone && cPhone !== myPhone;
        });

        setRecentContacts(
          filtered.map((u: any, i: number) => ({
            name: u.full_name ?? u.name ?? "Unknown",
            phone: u.phone,
            avatar: [
              "from-teal-500 to-cyan-600",
              "from-emerald-500 to-teal-600",
              "from-rose-500 to-pink-600",
              "from-violet-500 to-purple-600",
              "from-amber-500 to-orange-600",
            ][i % 5],
          })),
        );
      })
      .catch(() => {})
      .finally(() => setRecentLoading(false));
  }, [wallet]);

  useEffect(() => {
    if (phone.length !== 10) {
      setReceiverFound(false);
      setReceiverError("");
      setReceiverName("");
      return;
    }

    let cancelled = false;
    setReceiverLoading(true);
    setReceiverError("");

    walletApi
      .lookupUser(phone)
      .then((res: any) => {
        if (cancelled) return;
        const user = res.data?.data;
        setReceiverName(user?.full_name ?? "");
        setReceiverFound(true);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setReceiverFound(false);
        setReceiverName("");
        const code = e?.response?.data?.code;
        const status = e?.response?.status;
        const message = e?.response?.data?.message;
        if (status === 404 || code === "USER_NOT_FOUND") {
          setReceiverError("No PaySafe account found on this number.");
        } else if (code === "SELF_TRANSFER") {
          setReceiverError(
            "This is your own number. You can't send money to yourself.",
          );
        } else if (code === "ACCOUNT_FROZEN") {
          setReceiverError("This account is currently unavailable.");
        } else {
          setReceiverError(
            message ?? "Could not verify this number. Try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setReceiverLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [phone]);

  function handleSelectContact(contact: Contact) {
    setPhone(contact.phone.replace(/^\+91/, "").replace(/\D/g, "").slice(-10));
    setReceiverName(contact.name);
    setReceiverFound(true);
    setReceiverError("");
    setStep("amount");
  }

  function handleConfirm() {
    setPinError("");
    setStep("processing");
    setApiError(null);

    sendMoneyMutation.mutate(
      {
        receiver_phone: phone,
        amount: parseFloat(amount),
        note,
        pin,
      },
      {
        onSuccess: (response: any) => {
          const result = response?.data?.data ?? response?.data ?? {};
          const score =
            typeof result.risk_score === "number" ? result.risk_score : 0;
          const status: ResultType =
            result.status === "BLOCKED" ? "blocked" : "approved";
          const reasons: string[] = Array.isArray(result.reasons)
            ? result.reasons
            : [];
          setRiskScore(Math.round(score));
          setResultType(status);
          setRiskReasons(reasons);
          setStep("result");
        },
        onError: (error: any) => {
          const code = error?.response?.data?.code;
          const message = error?.response?.data?.message;
          const serverData =
            error?.response?.data?.data ?? error?.response?.data ?? {};

          if (
            PIN_ERROR_CODES.includes(code) ||
            error?.response?.status === 401
          ) {
            setPin("");
            setPinError(message ?? "Incorrect PIN. Please try again.");
            setStep("pin");
            sendMoneyMutation.reset();
            return;
          }

          const score =
            typeof serverData.risk_score === "number"
              ? serverData.risk_score
              : 85;
          const reasons: string[] = Array.isArray(serverData.reasons)
            ? serverData.reasons
            : [
                message ??
                  error?.message ??
                  "Transaction could not be completed.",
              ];

          setRiskScore(Math.round(score));
          setResultType("blocked");
          setRiskReasons(reasons);

          if (!error?.response) {
            setApiError(
              "Network error — please check your connection and try again.",
            );
          }
          setStep("result");
        },
      },
    );
  }

  function reset() {
    setStep("recipient");
    setPhone("");
    setReceiverName("");
    setNote("");
    setAmount("");
    setPin("");
    setPinError("");
    setReceiverFound(false);
    setReceiverError("");
    setRiskScore(0);
    setRiskReasons([]);
    setApiError(null);
    sendMoneyMutation.reset();
  }

  const STEP_ORDER: Step[] = [
    "recipient",
    "amount",
    "pin",
    "processing",
    "result",
  ];
  const STEP_LABELS = ["Recipient", "Amount", "Confirm"];
  const stepIndex = STEP_ORDER.indexOf(step);
  const displayIndex = Math.min(stepIndex, 2);
  const showTitle = step !== "processing" && step !== "result";

  return (
    <AppLayout
      title={showTitle ? "Send Money" : undefined}
      subtitle={showTitle ? "UPI-inspired flow for PaySafe wallet transfers in INR." : undefined}
    >
      <div className="p-5 md:p-8">
        <div className="mx-auto max-w-md">
          
          {showTitle && (
            <div className="mb-6">
              <div className="flex items-center gap-2">
                {STEP_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        i < displayIndex
                          ? "bg-teal-600 text-white"
                          : i === displayIndex
                            ? "bg-linear-to-br from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/30"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {i < displayIndex ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold ${i === displayIndex ? "text-slate-900" : "text-slate-400"}`}
                    >
                      {label}
                    </span>
                    {i < STEP_LABELS.length - 1 && (
                      <div
                        className={`flex-1 h-px transition-all ${i < displayIndex ? "bg-teal-600" : "bg-slate-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            {step === "recipient" && (
              <StepRecipient
                phone={phone}
                setPhone={(v) => {
                  setPhone(v);
                  if (v.length !== 10) {
                    setReceiverFound(false);
                    setReceiverName("");
                    setReceiverError("");
                  }
                }}
                note={note}
                setNote={setNote}
                receiverLoading={receiverLoading}
                receiverFound={receiverFound}
                receiverName={receiverName}
                receiverError={receiverError}
                recentContacts={recentContacts}
                recentLoading={recentLoading}
                onNext={() => setStep("amount")}
                onSelectContact={handleSelectContact}
              />
            )}

            {step === "amount" && (
              <StepAmount
                amount={amount}
                setAmount={setAmount}
                receiver={receiverName || "+91 " + phone}
                balance={BALANCE}
                balanceLoading={walletLoading}
                onNext={() => setStep("pin")}
                onBack={() => setStep("recipient")}
              />
            )}

            {step === "pin" && (
              <StepPin
                phone={phone}
                receiverName={receiverName}
                amount={amount}
                note={note}
                pin={pin}
                setPin={(v) => {
                  setPin(v);
                  if (pinError) setPinError("");
                }}
                pinVisible={pinVisible}
                setPinVisible={setPinVisible}
                pinError={pinError}
                onConfirm={handleConfirm}
                onBack={() => setStep("amount")}
                isSending={sendMoneyMutation.isPending}
              />
            )}

            {step === "processing" && <StepProcessing />}

            {step === "result" && (
              <StepResult
                type={resultType}
                amount={amount}
                receiverName={receiverName || "+91 " + phone}
                riskScore={riskScore}
                reasons={riskReasons}
                apiError={apiError}
                onDone={reset}
                phone={phone}
                note={note}
              />
            )}
          </div>

          {(step === "recipient" || step === "amount") && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Wallet className="h-3.5 w-3.5 text-slate-400" />
              Available balance:
              {walletLoading ? (
                <span className="inline-block h-3 w-20 animate-pulse rounded bg-slate-200" />
              ) : (
                <span className="font-bold text-slate-800">
                  ₹{BALANCE.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
