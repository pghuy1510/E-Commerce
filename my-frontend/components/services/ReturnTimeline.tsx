import { CheckCircle2, Clock3, RotateCcw, Truck } from "lucide-react";
import { usePreferences } from "@/lib/i18n";

export default function ReturnTimeline() {
  const { t } = usePreferences();
  const steps = [
    {
      title: t("returnPolicy.timeline.step1.title"),
      desc: t("returnPolicy.timeline.step1.desc"),
      icon: Clock3,
    },
    {
      title: t("returnPolicy.timeline.step2.title"),
      desc: t("returnPolicy.timeline.step2.desc"),
      icon: CheckCircle2,
    },
    {
      title: t("returnPolicy.timeline.step3.title"),
      desc: t("returnPolicy.timeline.step3.desc"),
      icon: Truck,
    },
    {
      title: t("returnPolicy.timeline.step4.title"),
      desc: t("returnPolicy.timeline.step4.desc"),
      icon: RotateCcw,
    },
  ];
  return (
    <div className="space-y-6">
      {steps.map((step, index) => {
        const Icon = step.icon;

        return (
          <div key={step.title} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-2xl bg-yellow-600 text-white flex items-center justify-center shadow-sm">
                <Icon className="w-5 h-5" />
              </div>
              {index < steps.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 mt-3" />
              )}
            </div>

            <div className="pt-1">
              <h4 className="text-lg font-semibold text-gray-900">
                {step.title}
              </h4>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
