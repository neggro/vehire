import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeSearchBox } from "@/components/search/home-search-box";
import {
  Search,
  Shield,
  CreditCard,
  Car,
  Star,
  ArrowRight,
  CheckCircle,
  MapPin,
  Quote,
  Zap,
} from "lucide-react";
import { APP_NAME, POPULAR_CITIES } from "@/constants";

const features = [
  {
    icon: Search,
    title: "Encuentra el auto perfecto",
    description:
      "Busca entre cientos de vehículos por ubicación, tipo, precio y más.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Reserva segura",
    description:
      "Todos los vehículos están verificados y contamos con seguro incluido.",
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: CreditCard,
    title: "Pago fácil",
    description:
      "Paga de forma segura con Mercado Pago. Sin costos ocultos.",
    accent: "bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Busca",
    description: "Encuentra el vehículo ideal para tu viaje en cualquier ciudad",
    icon: Search,
  },
  {
    step: 2,
    title: "Reserva",
    description: "Elige las fechas y realiza tu pago de forma segura",
    icon: CreditCard,
  },
  {
    step: 3,
    title: "Conduce",
    description: "Recoge el vehículo y disfruta tu viaje sin preocupaciones",
    icon: Car,
  },
];

const stats = [
  { value: "500+", label: "Vehículos disponibles" },
  { value: "10K+", label: "Viajes realizados" },
  { value: "4.9", label: "Calificación promedio", icon: Star },
  { value: "24/7", label: "Soporte al cliente" },
];

const testimonials = [
  {
    name: "María García",
    role: "Conductora frecuente",
    initials: "MG",
    content:
      "Excelente plataforma. He alquilado autos varias veces y siempre ha sido una experiencia fantástica.",
    rating: 5,
    color: "bg-primary/10 text-primary",
  },
  {
    name: "Carlos Rodríguez",
    role: "Anfitrión",
    initials: "CR",
    content:
      "Publiqué mi auto hace 6 meses y ya he generado más de $2000. Super fácil de usar.",
    rating: 5,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    name: "Ana Martínez",
    role: "Primera vez",
    initials: "AM",
    content:
      "Estaba un poco nerviosa pero todo fue muy simple. El auto estaba impecable y el anfitrión muy amable.",
    rating: 5,
    color: "bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-primary/[0.02] to-background wave-divider">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[hsl(var(--gold))]/[0.06] blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-primary/[0.06] blur-3xl" />
        </div>

        <div className="container relative py-24 md:py-36 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary animate-fade-up"
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              La forma más fácil de alquilar un auto
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-up stagger-2 opacity-0">
              Alquila vehículos{" "}
              <br className="hidden sm:block" />
              únicos en{" "}
              <span className="gradient-text">Uruguay</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto animate-fade-up stagger-3 opacity-0">
              {APP_NAME} conecta a propietarios de vehículos con personas que
              necesitan un auto. Desde económicos hasta deportivos de lujo.
            </p>

            {/* Search Box */}
            <div className="animate-fade-up stagger-4 opacity-0">
              <HomeSearchBox />
            </div>

            {/* Popular cities */}
            <div className="mt-8 flex flex-wrap justify-center gap-2 animate-fade-up stagger-5 opacity-0">
              <span className="text-sm text-muted-foreground mr-1">
                Popular:
              </span>
              {POPULAR_CITIES.slice(0, 4).map((city) => (
                <Link
                  key={city.name}
                  href={`/search?city=${encodeURIComponent(city.name)}`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                >
                  <MapPin className="h-3 w-3" />
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center p-6 rounded-2xl bg-muted/40 border border-border/40`}
              >
                <div className="text-3xl font-bold font-display text-primary md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              ¿Por qué elegir {APP_NAME}?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Somos la plataforma líder en alquiler de vehículos entre
              particulares en Uruguay
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="group relative overflow-hidden border-border/40 card-hover">
                <CardContent className="p-8">
                  <div className={`mb-5 inline-flex rounded-xl p-3.5 ${feature.accent}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold font-display">{feature.title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-[hsl(var(--gold))] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
        {/* Decorative bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/[0.04] blur-3xl" />
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Cómo funciona
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Alquilar un auto nunca fue tan fácil
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-12">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative text-center group">
                {/* Connector line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-primary/5" />
                )}

                {/* Step number + icon */}
                <div className="relative mx-auto mb-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-300">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--gold-foreground))] text-xs font-bold font-display shadow-md">
                    {item.step}
                  </div>
                </div>

                <h3 className="text-xl font-semibold font-display">{item.title}</h3>
                <p className="mt-3 text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button size="lg" asChild className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow px-8 h-12 text-base">
              <Link href="/search">
                Comenzar a buscar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Become a Host Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <Card className="overflow-hidden border-border/40 shadow-xl">
              <div className="grid md:grid-cols-2">
                <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-[hsl(var(--gold))]/10 p-8 md:p-12 lg:p-14">
                  {/* Decorative */}
                  <div className="absolute top-6 right-6 w-24 h-24 rounded-full bg-[hsl(var(--gold))]/10 blur-2xl" />

                  <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary">
                    Para propietarios
                  </Badge>
                  <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    ¿Tienes un vehículo?
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                    Gana dinero compartiendo tu auto cuando no lo usas. Miles de
                    anfitriones ya están generando ingresos extra.
                  </p>
                  <ul className="mt-8 space-y-4">
                    {[
                      "Gana dinero extra cada mes",
                      "Tú controlas tu disponibilidad",
                      "Seguro incluido en cada viaje",
                      "Soporte 24/7",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" className="mt-10 rounded-xl shadow-lg shadow-primary/20 px-8 h-12 text-base" asChild>
                    <Link href="/host">
                      Conviértete en anfitrión
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60 p-8 md:p-12">
                  <div className="text-center space-y-8">
                    <div>
                      <div className="text-6xl font-bold font-display text-primary">$0</div>
                      <div className="mt-2 text-muted-foreground font-medium">
                        Costo para publicar
                      </div>
                    </div>
                    <div className="w-16 h-px bg-border mx-auto" />
                    <div>
                      <div className="text-4xl font-bold font-display">
                        +$500<span className="text-lg text-muted-foreground font-normal">/mes</span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Ganancia promedio por vehículo
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Miles de personas confían en {APP_NAME}
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="border-border/40 card-hover">
                <CardContent className="p-8">
                  {/* Quote icon */}
                  <Quote className="h-8 w-8 text-primary/15 mb-4 -scale-x-100" />

                  {/* Stars */}
                  <div className="mb-4 flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                      />
                    ))}
                  </div>

                  <p className="text-foreground/80 leading-relaxed">
                    &quot;{testimonial.content}&quot;
                  </p>

                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border/40">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-display font-bold text-sm ${testimonial.color}`}>
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="font-semibold font-display text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">
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
      <section className="py-24 md:py-32 relative overflow-hidden">
        {/* Decorative bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/[0.04] blur-3xl" />
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              ¿Listo para tu próximo viaje?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Únete a miles de personas que ya confían en {APP_NAME}
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="rounded-xl shadow-lg shadow-primary/20 px-8 h-12 text-base">
                <Link href="/search">
                  Buscar vehículos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-xl px-8 h-12 text-base">
                <Link href="/login">Ingresa ahora</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
