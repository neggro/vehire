import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Shield,
  CreditCard,
  Car,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { APP_NAME, POPULAR_CITIES } from "@/constants";

const features = [
  {
    icon: Search,
    title: "Encuentra el auto perfecto",
    description:
      "Busca entre cientos de vehículos por ubicación, tipo, precio y más.",
  },
  {
    icon: Shield,
    title: "Reserva segura",
    description:
      "Todos los vehículos están verificados y contamos con seguro incluido.",
  },
  {
    icon: CreditCard,
    title: "Pago fácil",
    description:
      "Paga de forma segura con Mercado Pago. Sin costos ocultos.",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Busca",
    description: "Encuentra el vehículo ideal para tu viaje",
    icon: Search,
  },
  {
    step: 2,
    title: "Reserva",
    description: "Elige las fechas y realiza tu reserva",
    icon: CreditCard,
  },
  {
    step: 3,
    title: "Conduce",
    description: "Recoge el vehículo y disfruta tu viaje",
    icon: Car,
  },
];

const stats = [
  { value: "500+", label: "Vehículos disponibles" },
  { value: "10K+", label: "Viajes realizados" },
  { value: "4.9", label: "Calificación promedio" },
  { value: "24/7", label: "Soporte al cliente" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              La forma más fácil de alquilar un auto
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Alquila vehículos únicos en{" "}
              <span className="gradient-text">Uruguay</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              {APP_NAME} conecta a propietarios de vehículos con personas que
              necesitan un auto. Encuentra desde autos económicos hasta
              deportivos de lujo.
            </p>

            {/* Search Box */}
            <div className="mt-10">
              <Card className="mx-auto max-w-2xl">
                <CardContent className="p-4">
                  <form className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="¿Dónde quieres retirar el auto?"
                          className="h-12 w-full rounded-md border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Fechas del viaje"
                          className="h-12 w-full rounded-md border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <Button type="submit" size="lg" className="h-12 px-8">
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Popular cities */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                Ciudades populares:
              </span>
              {POPULAR_CITIES.slice(0, 4).map((city) => (
                <Link
                  key={city.name}
                  href={`/search?city=${encodeURIComponent(city.name)}`}
                  className="text-sm text-primary hover:underline"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              ¿Por qué elegir {APP_NAME}?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Somos la plataforma líder en alquiler de vehículos entre
              particulares en Uruguay
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Cómo funciona
            </h2>
            <p className="mt-4 text-muted-foreground">
              Alquilar un auto nunca fue tan fácil
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="absolute left-1/2 top-8 -z-10 h-0.5 w-full -translate-x-1/2 bg-primary/20 last:hidden md:block" />
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/search">
                Comenzar a buscar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Become a Host Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8 md:p-12">
                  <h2 className="text-3xl font-bold tracking-tight">
                    ¿Tienes un vehículo?
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Gana dinero compartiendo tu auto cuando no lo usas. Miles de
                    anfitriones ya están generando ingresos extra.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      "Gana dinero extra cada mes",
                      "Tú controlas tu disponibilidad",
                      "Seguro incluido en cada viaje",
                      "Soporte 24/7",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" className="mt-8" asChild>
                    <Link href="/host">
                      Conviértete en anfitrión
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center justify-center bg-muted/50 p-8 md:p-12">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary">$0</div>
                    <div className="mt-2 text-muted-foreground">
                      Costo para publicar
                    </div>
                    <div className="mt-6 text-3xl font-semibold">
                      +$500<span className="text-lg">/mes</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Ganancia promedio
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Lo que dicen nuestros usuarios
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                name: "María García",
                role: "Conductora frecuente",
                content:
                  "Excelente plataforma. He alquilado autos varias veces y siempre ha sido una experiencia fantástica.",
                rating: 5,
              },
              {
                name: "Carlos Rodríguez",
                role: "Anfitrión",
                content:
                  "Publiqué mi auto hace 6 meses y ya he generado más de $2000. Super fácil de usar.",
                rating: 5,
              },
              {
                name: "Ana Martínez",
                role: "Primera vez",
                content:
                  "Estaba un poco nerviosa pero todo fue muy simple. El auto estaba impecable y el anfitrión muy amable.",
                rating: 5,
              },
            ].map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    &quot;{testimonial.content}&quot;
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10" />
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              ¿Listo para tu próximo viaje?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Únete a miles de personas que ya confían en {APP_NAME}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/search">
                  Buscar vehículos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Crear cuenta gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
