// The people's faces (and the company's logo), shown once the film says so:
// p.faces lists the names revealed so far.
const FACES: Record<string, string> = { 'Sarah Connor': 'p1', 'Alice Johnson': 'p17', 'Emily Chen': 'p2', 'John Parker': 'p59', 'Rahul Mehta': 'rahul' }
const faceUrl = (label: string) => `${import.meta.env.BASE_URL}faces/${FACES[label]}.jpg`
export const ACME = `${import.meta.env.BASE_URL}acme.svg` // the company's logo, a made-up mark
export const faceOf = (faces: string[] | undefined, label: string) => (faces?.includes(label) ? faceUrl(label) : undefined)
// fetched up front, so a face is ready the frame it is asked for
export const preloadFaces = () => [...Object.keys(FACES).map(faceUrl), ACME].forEach((src) => (new Image().src = src))
