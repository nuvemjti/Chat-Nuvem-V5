export const ruleTypes = [
  { value: "numeric", label: "Regra númerica" },
  { value: "text", label: "Regra para texto" },
  { value: "date", label: "Regra para data" },
];

export const options = ["variable", "dayOfWeek"];
export const labels = {
tag: "tag",
variable: "Variáveis",
dayOfWeek: "Dia da semana",
}

export const conditions = {
  numeric: ["igual", "número maior", "número menor"],
  tag: ["igual", "diferente"],
  date: ["before", "after", "between"],
};