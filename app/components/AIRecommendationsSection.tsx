import { CheckCircle, Lightbulb } from "@phosphor-icons/react/dist/ssr";

interface Recommendation {
  id: string;
  name: string;
  reason: string;
}

interface CafeResult {
  id: string;
  name: string;
  description: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  featured_image_url: string | null;
  rating: number | null;
  review_count: number | null;
  is_new: boolean;
  is_featured: boolean;
  tag_names: string[];
}

interface AIRecommendationsSectionProps {
  response: {
    response: string;
    recommendations: Recommendation[];
  };
  cafes: CafeResult[];
}

export default function AIRecommendationsSection({
  response,
  cafes,
}: AIRecommendationsSectionProps) {
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        {/* AI Response Text */}
        <div className="mb-8 flex gap-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6">
          <div className="flex shrink-0 items-start">
            <Lightbulb
              size={24}
              weight="fill"
              className="text-blue-600 mt-1"
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#3b3b3b] mb-2">AI Assistant</h3>
            <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
              {response.response}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        {response.recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[#3b3b3b] mb-4 flex items-center gap-2">
              <CheckCircle size={20} weight="fill" className="text-green-600" />
              Top Recommendations
            </h3>

            <div className="space-y-3">
              {response.recommendations.map((rec, index) => (
                <div
                  key={rec.id}
                  className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
                >
                  {/* Rank Badge */}
                  <div className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600">
                    <span className="text-sm font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#3b3b3b] text-base mb-1">
                      {rec.name}
                    </h4>
                    <p className="text-sm text-zinc-600">
                      {rec.reason}
                    </p>

                    {/* Tags from original cafe data */}
                    {cafes &&
                      cafes.find((c) => c.id === rec.id)?.tag_names && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cafes
                            .find((c) => c.id === rec.id)
                            ?.tag_names.slice(0, 3)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      )}

                    {/* Rating & Location */}
                    {cafes && cafes.find((c) => c.id === rec.id) && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                        {cafes.find((c) => c.id === rec.id)?.rating && (
                          <span>
                            ⭐{" "}
                            {cafes.find((c) => c.id === rec.id)?.rating?.toFixed(1)}
                            ({cafes.find((c) => c.id === rec.id)?.review_count} reviews)
                          </span>
                        )}
                        {cafes.find((c) => c.id === rec.id)?.neighborhood && (
                          <span>
                            📍{" "}
                            {cafes.find((c) => c.id === rec.id)?.neighborhood}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {response.recommendations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-zinc-600">
              No specific recommendations found. Try adjusting your request!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
