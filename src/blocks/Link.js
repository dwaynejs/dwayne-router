import { Block, Children, Rest } from 'dwayne';

import { isString } from '../utils';

const watchArgs = ($) => ({
  ...$.args
});

export class Link extends Block {
  static html = html`
    <a href="{href}" Rest="{restArgs}">
      <Children/>
    </a>
  `;

  afterConstruct() {
    this.setArgs(
      this.evaluate(watchArgs, this.setArgs)
    );
  }

  setArgs = (args) => {
    let Href;
    let RestArgs;

    if (isString(args.href)) {
      const {
        href,
        ...restArgs
      } = args;

      Href = href;
      RestArgs = restArgs;
    } else {
      const {
        to,
        query,
        params,
        hash,
        ...restArgs
      } = args;

      Href = this.globals.router.buildURL(to, {
        query,
        params,
        hash
      });
      RestArgs = restArgs;
    }

    this.href = Href;
    this.restArgs = RestArgs;
  };
}
