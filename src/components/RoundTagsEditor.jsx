import { useEffect, useMemo, useState } from "react"
import { normalizeRoundTags } from "../utils/roundTags"

function mergeTagsFromInput(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export default function RoundTagsEditor({
  initialTags = [],
  availableTags = [],
  onSave,
  styles,
  saveLabel = "Save Tags",
}) {
  const [tagInput, setTagInput] = useState("")
  const [selectedTags, setSelectedTags] = useState(() =>
    normalizeRoundTags(initialTags, [...availableTags, ...initialTags])
  )

  useEffect(() => {
    setSelectedTags(normalizeRoundTags(initialTags, [...availableTags, ...initialTags]))
  }, [availableTags, initialTags])

  const allKnownTags = useMemo(
    () => normalizeRoundTags([...availableTags, ...selectedTags]).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    ),
    [availableTags, selectedTags]
  )

  const addTags = (incomingTags) => {
    setSelectedTags((prev) =>
      normalizeRoundTags([...prev, ...incomingTags], [...allKnownTags, ...incomingTags])
    )
    setTagInput("")
  }

  const handleAdd = () => {
    const parsedTags = mergeTagsFromInput(tagInput)
    if (parsedTags.length === 0) return
    addTags(parsedTags)
  }

  const toggleTag = (tag) => {
    const tagKey = String(tag || "").trim().toLowerCase()
    if (!tagKey) return

    setSelectedTags((prev) => {
      const exists = prev.some((item) => item.toLowerCase() === tagKey)
      if (exists) {
        return prev.filter((item) => item.toLowerCase() !== tagKey)
      }

      return normalizeRoundTags([...prev, tag], allKnownTags)
    })
  }

  const removeTag = (tag) => {
    const tagKey = String(tag || "").trim().toLowerCase()
    setSelectedTags((prev) => prev.filter((item) => item.toLowerCase() !== tagKey))
  }

  return (
    <>
      <label style={styles.label}>Round tags</label>
      <p style={styles.mutedText}>
        Add tags after the round and reuse existing ones so filtering stays consistent.
      </p>

      <div style={styles.inlineRow}>
        <input
          style={styles.textInput}
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="rain, windy, tournament"
        />
        <button type="button" style={styles.secondaryButtonCompact} onClick={handleAdd}>
          Add
        </button>
      </div>

      <div style={styles.tagRowCompact}>
        {selectedTags.map((tag) => (
          <button
            key={tag}
            type="button"
            style={styles.tagChip}
            onClick={() => removeTag(tag)}
          >
            {tag} x
          </button>
        ))}
      </div>

      <label style={styles.label}>Existing tags</label>
      {allKnownTags.length === 0 ? (
        <p style={styles.mutedText}>No saved tags yet.</p>
      ) : (
        <div style={styles.tagRowCompact}>
          {allKnownTags.map((tag) => {
            const selected = selectedTags.some((item) => item.toLowerCase() === tag.toLowerCase())

            return (
              <button
                key={tag}
                type="button"
                style={{
                  ...styles.tagChip,
                  ...(selected
                    ? {
                        background: "#dcfce7",
                        border: "1px solid #16a34a",
                        color: "#166534",
                      }
                    : {}),
                }}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}

      <button type="button" style={styles.primaryButton} onClick={() => onSave(selectedTags)}>
        {saveLabel}
      </button>
    </>
  )
}
