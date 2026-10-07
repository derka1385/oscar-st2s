export type GroupId =
  | "head"
  | "spine"
  | "thorax"
  | "scapular"
  | "upper"
  | "pelvic"
  | "lower";
export type AnatomyGroup = {
  id: GroupId;
  name: string;
  shortName: string;
  color: string;
  number?: number;
  description: string;
  axial: boolean;
};
export const groups: AnatomyGroup[] = [
  {
    id: "head",
    name: "Tête",
    shortName: "Tête",
    color: "#92918b",
    description:
      "Le crâne protège l’encéphale. Les os de la face forment les reliefs du visage.",
    axial: true,
  },
  {
    id: "spine",
    name: "Rachis / colonne vertébrale",
    shortName: "Rachis",
    color: "#ac739d",
    number: 1,
    description:
      "Le rachis soutient le corps et protège la moelle épinière. Il s’étend de la base du crâne au coccyx.",
    axial: true,
  },
  {
    id: "thorax",
    name: "Thorax",
    shortName: "Thorax",
    color: "#a3a194",
    description: "La cage thoracique protège notamment le cœur et les poumons.",
    axial: true,
  },
  {
    id: "scapular",
    name: "Ceinture scapulaire",
    shortName: "Ceinture scapulaire",
    color: "#76a58c",
    number: 3,
    description:
      "Les clavicules et les scapulas relient les membres supérieurs au tronc.",
    axial: false,
  },
  {
    id: "upper",
    name: "Membres supérieurs",
    shortName: "Membres supérieurs",
    color: "#7b9fc5",
    number: 4,
    description:
      "Du bras à la main, les membres supérieurs permettent la préhension et la manipulation.",
    axial: false,
  },
  {
    id: "pelvic",
    name: "Ceinture pelvienne",
    shortName: "Ceinture pelvienne",
    color: "#ca8b77",
    number: 2,
    description:
      "La ceinture pelvienne relie les membres inférieurs au squelette axial. Les deux os coxaux s’articulent avec le sacrum.",
    axial: false,
  },
  {
    id: "lower",
    name: "Membres inférieurs",
    shortName: "Membres inférieurs",
    color: "#c5ad68",
    number: 5,
    description:
      "Du bassin aux pieds, les membres inférieurs portent le poids du corps et permettent la locomotion.",
    axial: false,
  },
];
export const groupById = Object.fromEntries(
  groups.map((g) => [g.id, g]),
) as Record<GroupId, AnatomyGroup>;
