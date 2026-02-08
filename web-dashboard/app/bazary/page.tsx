import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart, MessageCircle, X, Eye } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatPrice, formatRelativeDate, getConfidenceColor } from "@/lib/utils";
import { BazarActions } from "@/components/bazar-actions";

async function getBazaroveNalezy(searchParams: { status?: string; zdroj?: string }) {
  const where: any = {};
  
  if (searchParams.status) {
    where.status = searchParams.status;
  } else {
    where.status = { in: ["new", "viewed", "interested"] };
  }
  
  if (searchParams.zdroj) {
    where.zdroj = searchParams.zdroj;
  }

  return prisma.bazarovyNalez.findMany({
    where,
    orderBy: [{ claudeConfidence: "desc" }, { datumNalezeni: "desc" }],
    include: { matchedProdukt: true },
    take: 50,
  });
}

export default async function BazaryPage({
  searchParams,
}: {
  searchParams: { status?: string; zdroj?: string };
}) {
  const nalezy = await getBazaroveNalezy(searchParams);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bazarové nálezy</h1>
          <p className="text-muted-foreground">
            Nabídky z bazarů odpovídající tvým kritériím
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button variant={!searchParams.status ? "default" : "outline"} size="sm" asChild>
              <a href="/bazary">Aktivní</a>
            </Button>
            <Button variant={searchParams.status === "new" ? "default" : "outline"} size="sm" asChild>
              <a href="?status=new">Nové</a>
            </Button>
            <Button variant={searchParams.status === "interested" ? "default" : "outline"} size="sm" asChild>
              <a href="?status=interested">Mám zájem</a>
            </Button>
            <Button variant={searchParams.status === "contacted" ? "default" : "outline"} size="sm" asChild>
              <a href="?status=contacted">Kontaktováno</a>
            </Button>
            <Button variant={searchParams.status === "bought" ? "default" : "outline"} size="sm" asChild>
              <a href="?status=bought">Koupeno</a>
            </Button>
            <Button variant={searchParams.status === "skip" ? "default" : "outline"} size="sm" asChild>
              <a href="?status=skip">Přeskočeno</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid of finds */}
      {nalezy.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Žádné nálezy k zobrazení
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nalezy.map((nalez) => (
            <Card key={nalez.id} className="overflow-hidden">
              {nalez.fotoUrl && (
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <img
                    src={nalez.fotoUrl}
                    alt={nalez.nazev}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge
                      className={`${getConfidenceColor(nalez.claudeConfidence)} bg-black/50`}
                    >
                      {nalez.claudeConfidence}/10
                    </Badge>
                  </div>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{nalez.nazev}</CardTitle>
                  <span className="text-xl font-bold text-green-500 whitespace-nowrap">
                    {formatPrice(Number(nalez.cena))}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{nalez.zdroj}</Badge>
                  <span>•</span>
                  <span>{formatRelativeDate(nalez.datumNalezeni)}</span>
                </div>
              </CardHeader>
              <CardContent>
                {nalez.popis && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {nalez.popis}
                  </p>
                )}
                {nalez.claudeWhy && (
                  <p className="text-sm text-primary mb-3">
                    💡 {nalez.claudeWhy}
                  </p>
                )}
                {nalez.matchedProdukt && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Matchuje s: <strong>{nalez.matchedProdukt.nazev}</strong>
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {nalez.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={nalez.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Zobrazit
                      </a>
                    </Button>
                  )}
                  <BazarActions nalezId={nalez.id} currentStatus={nalez.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
