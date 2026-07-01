import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ============================================================
  // USUÁRIOS
  // ============================================================
  const yves = await prisma.user.upsert({
    where: { name: "Yves" },
    update: {},
    create: { name: "Yves" },
  });
  const carol = await prisma.user.upsert({
    where: { name: "Carol" },
    update: {},
    create: { name: "Carol" },
  });
  console.log(`✅ Usuários: ${yves.name}, ${carol.name}`);

  // ============================================================
  // CATEGORIAS
  // ============================================================
  const expCats = [
    "Alimentação", "Transporte", "Saúde", "Educação",
    "Moradia", "Lazer", "Cartão de Crédito", "Boleto", "Outros",
  ];
  const incCats = ["Salário", "Freelance", "Investimento", "Outros Rendimentos"];

  for (const name of expCats) {
    await prisma.category.upsert({ where: { name }, update: { type: "expense" }, create: { name, type: "expense" } });
  }
  for (const name of incCats) {
    await prisma.category.upsert({ where: { name }, update: { type: "income" }, create: { name, type: "income" } });
  }
  console.log("✅ Categorias criadas");

  const catAlimentacao = await prisma.category.findFirst({ where: { name: "Alimentação" } });
  const catTransporte  = await prisma.category.findFirst({ where: { name: "Transporte" } });
  const catSalario     = await prisma.category.findFirst({ where: { name: "Salário" } });
  const catEducacao    = await prisma.category.findFirst({ where: { name: "Educação" } });
  const catLazer       = await prisma.category.findFirst({ where: { name: "Lazer" } });
  const catCartao      = await prisma.category.findFirst({ where: { name: "Cartão de Crédito" } });
  const catMoradia     = await prisma.category.findFirst({ where: { name: "Moradia" } });
  const catBoleto      = await prisma.category.findFirst({ where: { name: "Boleto" } });
  const catSaude       = await prisma.category.findFirst({ where: { name: "Saúde" } });

  if (!catAlimentacao || !catTransporte || !catSalario || !catEducacao ||
      !catLazer || !catCartao || !catMoradia || !catBoleto || !catSaude) {
    throw new Error("Categorias não encontradas após criação");
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // ============================================================
  // CARTÕES DE CRÉDITO
  // ============================================================
  const cardYves = await prisma.creditCard.upsert({
    where: { id: "card-yves-nubank" },
    update: {},
    create: {
      id: "card-yves-nubank",
      name: "Nubank Yves",
      brand: "Mastercard",
      color: "#820AD1",
      limit: 8000,
      closingDay: 3,
      dueDay: 10,
      userId: yves.id,
    },
  });
  const cardYves2 = await prisma.creditCard.upsert({
    where: { id: "card-yves-inter" },
    update: {},
    create: {
      id: "card-yves-inter",
      name: "Inter Yves",
      brand: "Mastercard",
      color: "#FF8700",
      limit: 5000,
      closingDay: 20,
      dueDay: 27,
      userId: yves.id,
    },
  });
  const cardCarol = await prisma.creditCard.upsert({
    where: { id: "card-carol-itau" },
    update: {},
    create: {
      id: "card-carol-itau",
      name: "Itaú Carol",
      brand: "Visa",
      color: "#003087",
      limit: 6000,
      closingDay: 15,
      dueDay: 22,
      userId: carol.id,
    },
  });
  console.log("✅ Cartões de crédito criados");

  // ============================================================
  // CONTAS BANCÁRIAS
  // ============================================================
  const accountYves = await prisma.bankAccount.upsert({
    where: { id: "account-yves-nubank" },
    update: {},
    create: {
      id: "account-yves-nubank",
      name: "Nubank Conta",
      type: "digital",
      initialBalance: 3500,
      currentBalance: 3500,
      color: "#820AD1",
      userId: yves.id,
    },
  });
  const accountCarol = await prisma.bankAccount.upsert({
    where: { id: "account-carol-caixa" },
    update: {},
    create: {
      id: "account-carol-caixa",
      name: "Caixa Econômica",
      type: "checking",
      initialBalance: 2800,
      currentBalance: 2800,
      color: "#005CA9",
      userId: carol.id,
    },
  });
  await prisma.bankAccount.upsert({
    where: { id: "account-shared-bb" },
    update: {},
    create: {
      id: "account-shared-bb",
      name: "BB Conta Conjunta",
      type: "checking",
      initialBalance: 5000,
      currentBalance: 5000,
      color: "#F9C900",
      userId: yves.id,
    },
  });
  console.log("✅ Contas bancárias criadas");

  // ============================================================
  // DESPESAS RECORRENTES (Contas Fixas)
  // ============================================================
  await prisma.recurringExpense.upsert({
    where: { id: "rec-aluguel" },
    update: {},
    create: {
      id: "rec-aluguel",
      description: "Aluguel",
      amount: 1800,
      periodicity: "monthly",
      dueDay: 5,
      automaticDebit: true,
      userId: yves.id,
      categoryId: catMoradia.id,
    },
  });
  await prisma.recurringExpense.upsert({
    where: { id: "rec-internet" },
    update: {},
    create: {
      id: "rec-internet",
      description: "Internet Fibra",
      amount: 120,
      periodicity: "monthly",
      dueDay: 10,
      automaticDebit: true,
      userId: yves.id,
      categoryId: catBoleto.id,
    },
  });
  await prisma.recurringExpense.upsert({
    where: { id: "rec-gym" },
    update: {},
    create: {
      id: "rec-gym",
      description: "Academia",
      amount: 99,
      periodicity: "monthly",
      dueDay: 15,
      automaticDebit: false,
      userId: carol.id,
      categoryId: catSaude.id,
      creditCardId: cardCarol.id,
    },
  });
  await prisma.recurringExpense.upsert({
    where: { id: "rec-seguro" },
    update: {},
    create: {
      id: "rec-seguro",
      description: "Seguro do Carro",
      amount: 380,
      periodicity: "monthly",
      dueDay: 20,
      automaticDebit: false,
      userId: yves.id,
      categoryId: catTransporte.id,
    },
  });
  console.log("✅ Contas fixas criadas");

  // ============================================================
  // LANÇAMENTOS DE EXEMPLO (mês atual)
  // ============================================================
  await prisma.transaction.create({
    data: {
      description: "Salário",
      amount: 8000,
      type: "income",
      paymentMethod: "pix",
      date: new Date(year, month, 5),
      userId: yves.id,
      categoryId: catSalario.id,
      bankAccountId: accountYves.id,
    },
  });
  await prisma.transaction.create({
    data: {
      description: "Salário",
      amount: 6500,
      type: "income",
      paymentMethod: "pix",
      date: new Date(year, month, 5),
      userId: carol.id,
      categoryId: catSalario.id,
      bankAccountId: accountCarol.id,
    },
  });
  await prisma.transaction.create({
    data: {
      description: "Supermercado",
      amount: 450,
      type: "expense",
      paymentMethod: "debit",
      date: new Date(year, month, 10),
      userId: yves.id,
      categoryId: catAlimentacao.id,
      bankAccountId: accountYves.id,
    },
  });
  await prisma.transaction.create({
    data: {
      description: "Combustível",
      amount: 200,
      type: "expense",
      paymentMethod: "credit",
      date: new Date(year, month, 12),
      userId: yves.id,
      categoryId: catTransporte.id,
      creditCardId: cardYves.id,
    },
  });
  await prisma.transaction.create({
    data: {
      description: "Restaurante",
      amount: 185,
      type: "expense",
      paymentMethod: "credit",
      date: new Date(year, month, 14),
      userId: carol.id,
      categoryId: catAlimentacao.id,
      creditCardId: cardCarol.id,
    },
  });
  await prisma.transaction.create({
    data: {
      description: "Uber",
      amount: 85,
      type: "expense",
      paymentMethod: "cash",
      date: new Date(year, month, 8),
      userId: carol.id,
      categoryId: catTransporte.id,
    },
  });
  console.log("✅ Lançamentos de exemplo criados");

  // ============================================================
  // PARCELAMENTOS DE EXEMPLO
  // ============================================================
  const notebookInstallment = await prisma.installment.create({
    data: {
      description: "Notebook",
      totalAmount: 6000,
      installmentCount: 10,
      installmentValue: 600,
      startDate: new Date(year, month, 5),
    },
  });
  for (let i = 0; i < 10; i++) {
    const d = new Date(year, month + i, 5);
    await prisma.transaction.create({
      data: {
        description: `Notebook - Parcela ${i + 1}/10`,
        amount: 600,
        type: "expense",
        paymentMethod: "credit",
        date: d,
        installmentNumber: i + 1,
        installmentTotal: 10,
        userId: yves.id,
        categoryId: catCartao.id,
        installmentId: notebookInstallment.id,
        creditCardId: cardYves.id,
      },
    });
  }

  const cursoInstallment = await prisma.installment.create({
    data: {
      description: "Curso de Inglês",
      totalAmount: 1800,
      installmentCount: 6,
      installmentValue: 300,
      startDate: new Date(year, month - 2, 10),
    },
  });
  for (let i = 0; i < 6; i++) {
    const m = month - 2 + i;
    const y = year + Math.floor(m / 12);
    const adj = ((m % 12) + 12) % 12;
    await prisma.transaction.create({
      data: {
        description: `Curso de Inglês - Parcela ${i + 1}/6`,
        amount: 300,
        type: "expense",
        paymentMethod: "credit",
        date: new Date(y, adj, 10),
        installmentNumber: i + 1,
        installmentTotal: 6,
        userId: carol.id,
        categoryId: catEducacao.id,
        installmentId: cursoInstallment.id,
        creditCardId: cardCarol.id,
      },
    });
  }

  const tvInstallment = await prisma.installment.create({
    data: {
      description: 'Smart TV 55"',
      totalAmount: 3600,
      installmentCount: 12,
      installmentValue: 300,
      startDate: new Date(year, month - 1, 15),
    },
  });
  for (let i = 0; i < 12; i++) {
    const m = month - 1 + i;
    const y = year + Math.floor(m / 12);
    const adj = ((m % 12) + 12) % 12;
    await prisma.transaction.create({
      data: {
        description: `Smart TV 55" - Parcela ${i + 1}/12`,
        amount: 300,
        type: "expense",
        paymentMethod: "credit",
        date: new Date(y, adj, 15),
        installmentNumber: i + 1,
        installmentTotal: 12,
        userId: yves.id,
        categoryId: catLazer.id,
        installmentId: tvInstallment.id,
        creditCardId: cardYves2.id,
      },
    });
  }

  console.log("✅ Parcelamentos de exemplo criados");

  // ============================================================
  // OBJETIVOS FINANCEIROS DE EXEMPLO (Sprint 3)
  // ============================================================
  await prisma.financialGoal.upsert({
    where: { id: "goal-reserva" },
    update: {},
    create: {
      id: "goal-reserva",
      title: "Reserva de Emergência",
      description: "6 meses de despesas guardados",
      targetAmount: 15000,
      currentAmount: 5000,
      deadline: new Date(year + 1, month, 1),
      category: "emergency",
      userId: yves.id,
    },
  });
  await prisma.financialGoal.upsert({
    where: { id: "goal-viagem" },
    update: {},
    create: {
      id: "goal-viagem",
      title: "Viagem para Europa",
      description: "Viagem de aniversário de casamento",
      targetAmount: 12000,
      currentAmount: 3200,
      deadline: new Date(year, month + 8, 1),
      category: "purchase",
      userId: carol.id,
    },
  });
  console.log("✅ Objetivos financeiros de exemplo criados");

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log(`\nUsuários disponíveis:`);
  console.log(`  - Yves (id: ${yves.id})`);
  console.log(`  - Carol (id: ${carol.id})`);
}

main()
  .catch((e) => { console.error("❌ Erro no seed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
