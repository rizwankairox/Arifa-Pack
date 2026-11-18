// The visible "Sample" tag on content that hasn't been approved yet (see src/data/clients.json).
import { t } from '@/i18n';
export function SampleTag() {
  return (
    <span className="sample-tag mono" title={t("Sample content, to be replaced with approved details")}>
      {t("Sample")}
    </span>
  );
}
