import { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function AdminEmptyState({ icon: Icon, title, description }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4 w-full">
      <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-4 border border-brand-border/30">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="font-extrabold text-brand-text text-base">{title}</h4>
      <p className="text-xs text-brand-muted mt-1.5 max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}
