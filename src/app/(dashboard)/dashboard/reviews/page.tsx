import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewList } from "@/components/reviews/review-components";

// Mock reviews
const mockReviews = [
  {
    id: "1",
    rating: 5,
    comment: "Excelente experiencia, muy recomendado!",
    createdAt: "2024-01-15",
    reviewer: {
      fullName: "María García",
      avatarUrl: null,
    },
  },
  {
    id: "2",
    rating: 4,
    comment: "Todo muy bien, el vehículo estaba en perfectas condiciones.",
    createdAt: "2024-01-10",
    reviewer: {
      fullName: "Juan Pérez",
      avatarUrl: null,
    },
  },
];

export default function ReviewsPage() {
  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reseñas</h1>
        <p className="text-muted-foreground">
          Reseñas de tus experiencias como conductor
        </p>
      </div>

      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tu calificación promedio</p>
                <p className="text-3xl font-bold">4.8</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Reseñas recibidas</p>
                <p className="text-3xl font-bold">{mockReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Reseñas recibidas</h2>
          <ReviewList reviews={mockReviews} />
        </div>
      </div>
    </div>
  );
}
