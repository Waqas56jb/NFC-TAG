/** Online portrait when DB has no uploaded photo. */
export function onlinePortrait(name, seed = '', style = 'lorelei') {
  const key = encodeURIComponent(String(seed || name || 'nfc').trim() || 'nfc')
  const label = encodeURIComponent(String(name || 'Student').trim().slice(0, 32) || 'Student')
  if (style === 'shapes') {
    return `https://api.dicebear.com/9.x/shapes/png?seed=${key}&size=256`
  }
  if (style === 'initials') {
    return `https://ui-avatars.com/api/?name=${label}&background=2f6f4e&color=fff&size=256&bold=true`
  }
  return `https://api.dicebear.com/9.x/lorelei/png?seed=${key}&size=256`
}

export function displayPhoto(photo, name, seed = '', style = 'lorelei') {
  if (photo && String(photo).trim()) return photo
  return onlinePortrait(name, seed, style)
}
