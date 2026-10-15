import { specializationEmoji } from './specializationEmojis'

/** Emoji + nom de la spécialisation (le nom reste en anglais, comme chez Epitech). */
export function SpecializationLabel({ specialization }: { specialization: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden>{specializationEmoji(specialization)}</span>
      {specialization}
    </span>
  )
}
