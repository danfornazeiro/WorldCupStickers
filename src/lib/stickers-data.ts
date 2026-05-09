export type StickerGroup = {
  code: string;
  country: string;
  total: number;
  label: string;
};

export const stickerGroups: StickerGroup[] = [
  { code: "FWC", country: "Mundial FIFA", total: 20, label: "FIFA" },
  { code: "MEX", country: "México", total: 20, label: "México" },
  { code: "RSA", country: "África do Sul", total: 20, label: "África do Sul" },
  { code: "KOR", country: "Coreia do Sul", total: 20, label: "Coreia do Sul" },
  {
    code: "CZE",
    country: "República Tcheca",
    total: 20,
    label: "República Tcheca",
  },
  { code: "CAN", country: "Canadá", total: 20, label: "Canadá" },
  {
    code: "BIH",
    country: "Bósnia e Herzegovina",
    total: 20,
    label: "Bósnia e Herzegovina",
  },
  { code: "QAT", country: "Catar", total: 20, label: "Catar" },
  { code: "SUI", country: "Suíça", total: 20, label: "Suíça" },
  { code: "BRA", country: "Brasil", total: 20, label: "Brasil" },
  { code: "MAR", country: "Marrocos", total: 20, label: "Marrocos" },
  { code: "HAI", country: "Haiti", total: 20, label: "Haiti" },
  { code: "SCO", country: "Escócia", total: 20, label: "Escócia" },
  {
    code: "USA",
    country: "Estados Unidos",
    total: 20,
    label: "Estados Unidos",
  },
  { code: "PAR", country: "Paraguai", total: 20, label: "Paraguai" },
  { code: "AUS", country: "Austrália", total: 20, label: "Austrália" },
  { code: "TUR", country: "Turquia", total: 20, label: "Turquia" },
  { code: "GER", country: "Alemanha", total: 20, label: "Alemanha" },
  { code: "CUW", country: "Curaçao", total: 20, label: "Curaçao" },
  {
    code: "CIV",
    country: "Costa do Marfim",
    total: 20,
    label: "Costa do Marfim",
  },
  { code: "ECU", country: "Equador", total: 20, label: "Equador" },
  { code: "NED", country: "Holanda", total: 20, label: "Holanda" },
  { code: "JPN", country: "Japão", total: 20, label: "Japão" },
  { code: "SWE", country: "Suécia", total: 20, label: "Suécia" },
  { code: "TUN", country: "Tunísia", total: 20, label: "Tunísia" },
  { code: "BEL", country: "Bélgica", total: 20, label: "Bélgica" },
  { code: "EGY", country: "Egito", total: 20, label: "Egito" },
  { code: "IRN", country: "Irã", total: 20, label: "Irã" },
  { code: "NZL", country: "Nova Zelândia", total: 20, label: "Nova Zelândia" },
  { code: "ESP", country: "Espanha", total: 20, label: "Espanha" },
  { code: "CPV", country: "Cabo Verde", total: 20, label: "Cabo Verde" },
  {
    code: "KSA",
    country: "Arábia Saudita",
    total: 20,
    label: "Arábia Saudita",
  },
  { code: "URU", country: "Uruguai", total: 20, label: "Uruguai" },
  { code: "FRA", country: "França", total: 20, label: "França" },
  { code: "SEN", country: "Senegal", total: 20, label: "Senegal" },
  { code: "IRQ", country: "Iraque", total: 20, label: "Iraque" },
  { code: "NOR", country: "Noruega", total: 20, label: "Noruega" },
  { code: "ARG", country: "Argentina", total: 20, label: "Argentina" },
  { code: "ALG", country: "Argélia", total: 20, label: "Argélia" },
  { code: "AUT", country: "Áustria", total: 20, label: "Áustria" },
  { code: "JOR", country: "Jordânia", total: 20, label: "Jordânia" },
  { code: "POR", country: "Portugal", total: 20, label: "Portugal" },
  {
    code: "COD",
    country: "República Democrática do Congo",
    total: 20,
    label: "R.D. Congo",
  },
  { code: "UZB", country: "Uzbequistão", total: 20, label: "Uzbequistão" },
  { code: "COL", country: "Colômbia", total: 20, label: "Colômbia" },
  { code: "ENG", country: "Inglaterra", total: 20, label: "Inglaterra" },
  { code: "CRO", country: "Croácia", total: 20, label: "Croácia" },
  { code: "GHA", country: "Gana", total: 20, label: "Gana" },
  { code: "PAN", country: "Panamá", total: 20, label: "Panamá" },
  { code: "CC", country: "Colecionáveis", total: 14, label: "Colecionáveis" },
];

export type StickerRecord = {
  code: string;
  country: string;
  type: string;
};

export const allStickerRecords: StickerRecord[] = stickerGroups.flatMap(
  (group) =>
    Array.from({ length: group.total }, (_, index) => {
      const suffix =
        group.code === "FWC"
          ? String(index).padStart(2, "0")
          : String(index + 1);

      return {
        code: `${group.code}${suffix}`,
        country: group.country,
        type: group.code,
      };
    }),
);

export const stickerGroupMap = new Map(
  stickerGroups.map((group) => [group.code, group]),
);
