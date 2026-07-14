import { Node, mergeAttributes } from "@tiptap/core";

export interface LinkPreviewCardAttrs {
  url: string;
  title?: string | null;
  image?: string | null;
  siteName?: string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkPreviewCard: {
      insertLinkPreviewCard: (attrs: LinkPreviewCardAttrs) => ReturnType;
    };
  }
}

export const LinkPreviewCard = Node.create({
  name: "linkPreviewCard",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      url: { default: null },
      title: { default: null },
      image: { default: null },
      siteName: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.link-preview-card",
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          return {
            url: el.getAttribute("data-url"),
            title: el.getAttribute("data-title"),
            image: el.getAttribute("data-image"),
            siteName: el.getAttribute("data-site"),
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const { url, title, image, siteName } = node.attrs as LinkPreviewCardAttrs;
    const linkChildren: unknown[] = [];
    if (image) {
      linkChildren.push(["img", { src: image, alt: "", class: "link-preview-image" }]);
    }
    const bodyChildren: unknown[] = [
      ["div", { class: "link-preview-title" }, title || url],
    ];
    if (siteName) {
      bodyChildren.push(["div", { class: "link-preview-site" }, siteName]);
    }
    linkChildren.push(["div", { class: "link-preview-body" }, ...bodyChildren]);

    return [
      "div",
      mergeAttributes({
        class: "link-preview-card",
        "data-url": url ?? "",
        "data-title": title ?? "",
        "data-image": image ?? "",
        "data-site": siteName ?? "",
      }),
      ["a", { href: url, target: "_blank", rel: "noopener noreferrer", class: "link-preview-link" }, ...linkChildren],
    ];
  },

  addCommands() {
    return {
      insertLinkPreviewCard:
        (attrs: LinkPreviewCardAttrs) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs });
        },
    };
  },
});
