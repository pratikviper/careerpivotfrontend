"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRate } from "@/lib/format"
import type { Recommendations } from "@/types/api"

/** What the tracker has learned so far. Every line states its sample size and how sure the data is. */
export function InsightsCard({ data, compact = false }: { data: Recommendations | null; compact?: boolean }) {
  if (!data) return null
  const baseline = data.baseline_response_rate
  return (
    <Card>
      <CardHeader>
        <CardTitle>What your applications are telling you</CardTitle>
        <p className="text-sm text-muted-foreground">
          {data.message}
          {baseline != null && data.sufficient_data ? ` Overall: ${formatRate(baseline)} reached an interview.` : ""}
          {data.excluded_recent_pending > 0 ? ` ${data.excluded_recent_pending} recent application(s) are not counted yet, since a reply may still come.` : ""}
        </p>
      </CardHeader>
      {data.insights.length > 0 ? (
        <CardContent className="space-y-3">
          <ul className="space-y-3">
            {data.insights.map((insight) => (
              <li key={`${insight.dimension}-${insight.group}`} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={insight.confidence === "reliable" ? "default" : "outline"}>
                    {insight.confidence === "reliable" ? "Reliable" : "Early signal"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{insight.dimension_label}</span>
                </div>
                <p className="mt-2 text-sm font-medium">{insight.text}</p>
                {!compact ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {insight.suggestion} 95% range: {formatRate(insight.ci95[0])}–{formatRate(insight.ci95[1])} for this group,{" "}
                    {formatRate(insight.rest_ci95[0])}–{formatRate(insight.rest_ci95[1])} for the rest.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{insight.suggestion}</p>
                )}
              </li>
            ))}
          </ul>
          {!compact ? <p className="text-xs text-muted-foreground">{data.disclaimer}</p> : null}
        </CardContent>
      ) : null}
    </Card>
  )
}
