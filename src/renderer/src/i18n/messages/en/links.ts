/**
 * Strings for the "links" area.
 * Keys must be prefixed with "links." and mirrored in it/links.ts.
 */
export default {
  // Section
  'links.title': 'Useful links ({count})',
  'links.hint': 'guides, wikis, videos, mods: the preview comes from the page itself',
  'links.url.placeholder': 'https://… (guide, wiki, video, mod)',
  'links.label.placeholder': 'Label (optional)',
  'links.add': 'Add link',

  // Preset labels (values stored by LINK_LABELS in db/types.ts)
  'links.label.guide': 'Guide',
  'links.label.wiki': 'Wiki',
  'links.label.video': 'Video',
  'links.label.cheats': 'Cheats',
  'links.label.mod': 'Mod',
  'links.label.forum': 'Forum',
  'links.label.store': 'Store',

  // Empty state
  'links.empty.title': 'No links',
  'links.empty.message': 'Save the links you need while playing here: a guide, the wiki page, a video tutorial, the mods page.',

  // Toasts
  'links.added': 'Link added: fetching the preview…',
  'links.updated': 'Link updated.',
  'links.deleted': 'Link deleted.',
  'links.invalidUrl': 'Enter a valid address, e.g. https://www.pcgamingwiki.com/wiki/…',
  'links.preview.none': "This page has no preview: the link is still valid.",
  'links.preview.updated': 'Preview updated.',

  // Confirm dialog
  'links.delete.title': 'Delete the link?',
  'links.delete.message': '{name} will be removed from this game.',

  // Editing and list
  'links.edit.title': 'Displayed title',
  'links.edit.label': 'Label',
  'links.addedAt': 'added {date}',
  'links.updatedAt': ' · updated {date}',
  'links.previewed': ' · preview',
  'links.preview': 'Preview',
  'links.preview.title': 'Re-reads title, description and image from the page'
}
