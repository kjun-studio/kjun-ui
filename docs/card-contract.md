# Card contract

Card groups related content. Actions belong to buttons and links within it.

## Content cases

- Information: title, description, content and a footer action.
- Statistics: a number and supporting context, without a required header.
- Media: an edge-to-edge media slot above the padded content.
- Table: padded header/footer with `bodyPadding="none"` for the table.
- Form: labeled inputs with footer actions and optional section dividers.
- Action-only header: actions render without a title and align to the end.

## Independent options

- `surface`: default, muted, accent, success, warning, danger, subtle, brand or glass. Each surface owns background, foreground and border color roles only. Glass additionally uses the shared blur geometry on Web; Native uses its supplied translucent background.
- `padding`: none, sm, md or lg. Applies to content sections, not the outer box. Defaults to md.
- `bodyPadding`: overrides only the body inset; otherwise inherits padding.
- `radius`: none, sm, md or lg. Defaults to md; 0/8/12/16 from the shared radius scale.
- `border`: defaults to false and controls the outline for every surface.
- `elevation`: flat or raised, independent of surface and border.
- `dividers`: controls lines between the header/body/footer; does not add an outer border.

The header, body and footer share their horizontal inset. Without dividers, adjacent sections share one vertical gap. With dividers, both sides of a line retain their inset. `padding="none"` removes all section insets; `bodyPadding="none"` preserves header/footer insets.

`header` replaces the title/subtitle area and can coexist with `headerActions`. A media slot clips only its own content to the top corners. Body and footer content, focus outlines and popups remain unclipped. Container width belongs to the caller; there is no viewport-dependent padding mode.

All three implementations consume the same geometry and surface role definitions. Examples and integration checks use packed packages. Native Web checks do not verify iOS/Android blur, font rendering or touch behavior.
