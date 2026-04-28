import { useEffect } from "react";
import { Card, Screen, VerseCard } from "../../components/ui";
import { cacheTodaySnippet, getCachedSnippet } from "../../services/cacheService";
import { trackEvent } from "../../services/analyticsService";

/**
 * SnippetScreen renders a tiny scripture moment, suitable for the upcoming
 * lock-screen and home-screen widgets.
 *
 * TODO[WIDGETKIT_PHASE2]: Wire this payload to an iOS WidgetKit timeline.
 * TODO[ANDROID_WIDGET_PHASE2]: Wire this payload to an Android App Widget provider.
 */
export function SnippetScreen() {
  const dateKey = new Date().toISOString().slice(0, 10);
  const fallback = "TODO[NIV_LICENSE]: Licensed NIV snippet appears here once approved.";
  const cached = getCachedSnippet(dateKey) ?? fallback;
  cacheTodaySnippet(dateKey, cached);

  useEffect(() => {
    void trackEvent("snippet_viewed");
  }, []);

  return (
    <Screen title="Snippet" subtitle="A single line of scripture for a quiet moment.">
      <VerseCard
        eyebrow="Today"
        reference="Psalm 119:105"
        text={cached}
        translation="NIV"
      />
      <Card
        eyebrow="Coming soon"
        title="Lock-screen widgets"
        body="BibleByte will deliver this snippet to your iOS lock screen and Android home screen in a future release."
        tone="soft"
      />
    </Screen>
  );
}
