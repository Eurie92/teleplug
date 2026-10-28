/**
 * Parses and resolves Spintax formatting: {option1|option2|option3}
 * Recursively resolves nested Spintax structures.
 * Also replaces dynamic tags: {group_name}, {time}, {date}, {random_num}
 */
export function parseSpintax(
  template: string,
  variables: Record<string, string> = {}
): string {
  if (!template) return ''

  // 1. Resolve Spintax patterns: {choice1|choice2|...}
  // Matches { ... } containing at least one pipe '|'
  const spintaxRegex = /\{([^{}]*\|[^{}]*)\}/g
  let resolved = template
  let maxPasses = 15 // safety guard against infinite loops

  while (maxPasses > 0 && spintaxRegex.test(resolved)) {
    maxPasses--
    resolved = resolved.replace(spintaxRegex, (_, choicesStr: string) => {
      const choices = choicesStr.split('|')
      const randomIndex = Math.floor(Math.random() * choices.length)
      return choices[randomIndex].trim()
    })
  }

  // 2. Replace dynamic variables / tags
  const now = new Date()
  const defaultVars: Record<string, string> = {
    time: now.toLocaleTimeString(),
    date: now.toLocaleDateString(),
    random_num: Math.floor(1000 + Math.random() * 9000).toString(),
    ...variables,
  }

  for (const [key, value] of Object.entries(defaultVars)) {
    const varRegex = new RegExp(`\\{${key}\\}`, 'gi')
    resolved = resolved.replace(varRegex, value)
  }

  return resolved
}
