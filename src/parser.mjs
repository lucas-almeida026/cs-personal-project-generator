export function parseCustomFormat(input) {
	const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0)
	const obj = {}

	let idx = 0
	while (idx < lines.length) {
		const nextList = parseList(lines, idx, obj)
		if (nextList === idx) {
			const nextItem = parseListItem(lines, idx, obj)
			if (nextItem === idx) {
				const nextString = parseString(lines, idx, obj)
				if (nextString === idx) {
					idx++ // Increment manually if no match
				} else {
					idx = nextString
				}
			} else {
				idx = nextItem
			}
		} else {
			idx = nextList
		}
	}

	return obj
}

export function parseString(lines, idx, target) {
	const line = lines[idx]
	const match = line.match(/^\[string\](?:\(([^)]*)\))?\s*(.+)$/)
	if (match) {
		const key = match[1]
		const value = match[2]
		if (Array.isArray(target)) {
			target.push(value)
		} else {
			target[key] = value
		}
		return idx + 1 // Move to the next line
	}
	return idx // No match, stay on the same line
}

export function parseListItem(lines, idx, target) {
	let initIdx = idx
	if (Array.isArray(target)) {
		target.push({})
		target = target[target.length - 1]
	}
	if (lines[idx].startsWith('[item-start]')) {
		while (idx < lines.length && !lines[idx].startsWith('[item-end]')) {
			const nextList = parseList(lines, idx, target)
			if (nextList === idx) {
				const nextString = parseString(lines, idx, target)
				if (nextString === idx) {
					idx++ // Increment manually if no match
				} else {
					idx = nextString
				}
			} else {
				idx = nextList
			}
		}
		return idx + 1 // Move past '[item-end]'
	} else {
		return initIdx // No match, stay on the same line
	}
}

export function parseList(lines, idx, target) {
	let initIdx = idx
	const match = lines[idx].match(/^\[list-start\]\(([^)]+)\)/)
	if (match) {
		const key = match[1]
		if (!target[key]) {
			target[key] = []
		}
		while (idx < lines.length && !lines[idx].startsWith('[list-end]')) {
			const next = parseListItem(lines, idx, target[key])
			if (next === idx) {
				target[key] = target[key].filter((item) => Object.keys(item).length > 0)
				const stringNext = parseString(lines, idx, target[key])
				if (stringNext === idx) {
					idx++ // Increment manually if no match
				} else {
					idx = stringNext
				}
			} else {
				idx = next
			}
		}
		return idx + 1 // Move to the next line
	} else {
		return initIdx // No match, stay on the same line
	}
}