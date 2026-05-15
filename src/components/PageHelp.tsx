import { Info } from "lucide-react";

export default function PageHelp({
  title = "Toelichting & rekenmethode",
  children,
  defaultOpen = false,
}: {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group bg-blue-50 border border-blue-200 rounded-xl overflow-hidden"
    >
      <summary className="cursor-pointer list-none px-5 py-3 flex items-center gap-2 text-sm font-medium text-blue-900 select-none hover:bg-blue-100/60 transition">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>{title}</span>
        <span className="ml-auto text-xs text-blue-700 font-normal">
          <span className="group-open:hidden">Toon uitleg ▾</span>
          <span className="hidden group-open:inline">Verberg uitleg ▴</span>
        </span>
      </summary>
      <div className="px-5 pb-4 pt-1 text-sm text-blue-950/90 leading-relaxed space-y-3 border-t border-blue-200/70">
        {children}
      </div>
    </details>
  );
}

export function HelpList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5">{children}</ul>;
}

export function HelpNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs leading-relaxed">
      <strong>Let op:</strong> {children}
    </div>
  );
}

export function HelpSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-2 first:pt-0">
      <h3 className="font-semibold text-blue-900 mb-1.5">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
