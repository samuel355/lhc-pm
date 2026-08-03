import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatColor = "primary" | "chart-2" | "chart-3" | "chart-4" | "chart-5";

const COLOR_STYLES: Record<StatColor, { icon: string; iconHover: string; value: string; glow: string }> = {
  primary: {
    icon: "bg-primary/10 text-primary group-hover:bg-primary/20",
    iconHover: "group-hover:shadow-primary/10 dark:group-hover:shadow-primary/20",
    value: "text-primary",
    glow: "from-primary/5 via-transparent to-accent/5",
  },
  "chart-2": {
    icon: "bg-chart-2/10 text-chart-2 group-hover:bg-chart-2/20",
    iconHover: "group-hover:shadow-chart-2/10 dark:group-hover:shadow-chart-2/20",
    value: "text-chart-2",
    glow: "from-chart-2/5 via-transparent to-chart-3/5",
  },
  "chart-3": {
    icon: "bg-chart-3/10 text-chart-3 group-hover:bg-chart-3/20",
    iconHover: "group-hover:shadow-chart-3/10 dark:group-hover:shadow-chart-3/20",
    value: "text-chart-3",
    glow: "from-chart-3/5 via-transparent to-chart-4/5",
  },
  "chart-4": {
    icon: "bg-chart-4/10 text-chart-4 group-hover:bg-chart-4/20",
    iconHover: "group-hover:shadow-chart-4/10 dark:group-hover:shadow-chart-4/20",
    value: "text-chart-4",
    glow: "from-chart-4/5 via-transparent to-chart-5/5",
  },
  "chart-5": {
    icon: "bg-chart-5/10 text-chart-5 group-hover:bg-chart-5/20",
    iconHover: "group-hover:shadow-chart-5/10 dark:group-hover:shadow-chart-5/20",
    value: "text-chart-5",
    glow: "from-chart-5/5 via-transparent to-primary/5",
  },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon: LucideIcon;
  color?: StatColor;
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  color = "primary",
  href,
  className,
}: StatCardProps) {
  const styles = COLOR_STYLES[color];

  const content = (
    <Card
      className={cn(
        "glass-card relative overflow-hidden border-border/50 transition-all duration-500",
        href && "group cursor-pointer hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl",
        href && styles.iconHover,
        className
      )}
    >
      {href && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            styles.glow
          )}
        />
      )}
      <div className="relative flex items-center gap-4 px-6">
        <div className={cn("shrink-0 rounded-xl p-3 transition-colors duration-300", styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <div className={cn("text-3xl font-bold", styles.value)}>{value}</div>
          {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
