import LegacyPageRenderer from "../../components/legacy/LegacyPageRenderer";

export const dynamic = "force-dynamic";

export default function ServiceDetailsPage() {
  return <LegacyPageRenderer templatePath="/legacy/service-details.html" />;
}
