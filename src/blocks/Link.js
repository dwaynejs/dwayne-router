import { isString } from '../utils';

export function Link(Block) {
  return class Link extends Block {
    /* eslint prefer-template: 0 */
    static template = ''
      + '<a'
      + '  href="{href}"'
      + '  d-class#router-link="{className}"'
      + '  d-style#router-link="{style}"'
      + '  d-rest="{restArgs}"'
      + '>'
        + '<d-block/>'
      + '</a>';

    afterConstruct() {
      this.watch('args', () => {
        let ClassName;
        let RestArgs;
        let Style;

        if (isString(this.args.href)) {
          const {
            href,
            class: className,
            style,
            ...restArgs
          } = this.args;

          this.href = href;
          ClassName = className;
          Style = style;
          RestArgs = restArgs;
        } else {
          const {
            to,
            class: className,
            style,
            query,
            params,
            hash,
            ...restArgs
          } = this.args;

          this.href = this.globals.router.buildURL(to, {
            query,
            params,
            hash
          });
          ClassName = className;
          Style = style;
          RestArgs = restArgs;
        }

        this.className = ClassName;
        this.style = Style;
        this.restArgs = RestArgs;
      });
    }
  };
}
