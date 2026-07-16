/**
 * Computed CSS properties captured during DOM walk (Phase 1 subset).
 * Keep list stable — expanding later is fine; avoid dropping keys without changelog.
 */
export const COMPUTED_STYLE_PROPS = [
  // box
  "display",
  "position",
  "boxSizing",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  // flex / grid
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  "alignSelf",
  "gap",
  "gridTemplateColumns",
  "gridTemplateRows",
  // visual
  "backgroundColor",
  "backgroundImage",
  "color",
  "opacity",
  "overflow",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderTopStyle",
  "borderTopColor",
  "borderRadius",
  "boxShadow",
  // typography
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textDecoration",
  "textTransform",
  "whiteSpace",
  // layout misc
  "zIndex",
  "top",
  "right",
  "bottom",
  "left",
  "transform",
  "visibility",
  "cursor",
] as const;

export type ComputedStyleProp = (typeof COMPUTED_STYLE_PROPS)[number];

export const COMPUTED_STYLE_PROP_COUNT = COMPUTED_STYLE_PROPS.length;
