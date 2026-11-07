import { PrismaClient, Station } from "@prisma/client";

const prisma = new PrismaClient();

const catalog = [
  { name: "Drinks", station: Station.BAR, products: [["Caipirinha",1500],["Copão c/ gelo sabor",2000],["Copão c/ gelo sabor e gin",2200],["Copão c/ gelo sabor e whisky",2500]] },
  { name: "Coquetéis", station: Station.BAR, products: [["Vinho cremoso",2200],["Abacaxi cremoso",2200],["Morango cremoso",2200],["Kiwi cremoso",2200],["Pitaya cremosa",2200],["Campari c/ suco de laranja",2200],["Coquetel de frutas",2000]] },
  { name: "Doses", station: Station.BAR, products: [["Pitú",600],["Vodka Slova",600],["Vodka Natasha",1000],["Vodka Absolut",1500],["Campari",1200],["Vodka Ski",800],["Martini",1200],["Montilla",1000],["Palhinha",800],["Conhaque Dreher",600],["Domecq",800],["Genebra",700],["Alcatrão",1000],["Whisky Red Label",1200],["Whisky Passport",1200],["Whisky Old Parr",2500],["Whisky Chivas",2500],["Seleta",1200],["Ypióca",1000],["Taça de vinho",1500],["Taça de suco de uva",800]] },
  { name: "Jarras e unidades", station: Station.BAR, products: [["Suco de laranja (jarra)",1500],["Água de coco (jarra)",1500],["Coco verde (unidade)",700]] },
  { name: "Gelo de sabor", station: Station.BAR, products: [["Morango",800],["Melancia",800],["Maçã verde",800],["Coco",800],["Maracujá",800]] },
  { name: "Jantinhas", station: Station.COZINHA, products: [["Macaxeira c/ carne",2500],["Cuscuz c/ carne",2500],["Pão c/ carne",2500],["Sopa (G)",2500],["Sopa (P)",1500]] },
  { name: "Caldinhos", station: Station.COZINHA, products: [["Camarão",2200],["Sururu",2000],["Mariscada",2200],["Mocotó",2000],["Feijão",1500],["Dobradinha",2200],["Caldo verde",2000],["Macaxeira c/ charque",2000]] },
  { name: "Espetinhos", station: Station.COZINHA, products: [["Picanha",1800],["Cupim",1800],["Alcatra",1800],["Filé mignon",1800],["Costela de porco",1800],["Carneiro",1800],["Coração",1500],["Medalhão de frango",1800],["Medalhão de carne",1800],["Queijo",1500],["Pão de alho",1000],["Kafta",1500],["Camarão",1500]] },
  { name: "Frutos do mar", station: Station.COZINHA, products: [["Isca de peixe",3500],["Caranguejo (unidade)",700],["Siri (unidade)",700],["Camarão alho e óleo",3500]] },
  { name: "Tira-gostos", station: Station.COZINHA, products: [["Carne sol c/ fritas (G)",6500],["Carne sol c/ fritas (P)",5500],["Calabresa acebolada",3500],["Calabresa c/ fritas",4500],["Batata recheada",3800],["Codorna (unidade)",1700],["Ovo de codorna (15)",1500],["Passarinha",2500],["Tripinha bovina",2800],["Torresmo",2800],["Fígado acebolado",2500],["Costela de porco",3500],["Isca frango",4500],["Batata frita (G)",2500],["Batata frita (P)",2000]] },
  { name: "Porções e extras", station: Station.COZINHA, products: [["Creme de alho ou verde",600],["Arroz",700],["Feijão",800],["Farofa",800],["Vinagrete",600]] }
] as const;

async function main() {
  for (const group of catalog) {
    let category = await prisma.category.findFirst({ where: { name: group.name } });
    if (!category) category = await prisma.category.create({ data: { name: group.name, station: group.station } });
    for (const [name, priceCents] of group.products) {
      const existing = await prisma.product.findFirst({ where: { categoryId: category.id, name } });
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data: { priceCents, available: true } });
      } else {
        await prisma.product.create({ data: { categoryId: category.id, name, priceCents } });
      }
    }
  }
  console.log("Catálogo do Boteco da Alagoana sincronizado.");
}
main().finally(() => prisma.$disconnect());
