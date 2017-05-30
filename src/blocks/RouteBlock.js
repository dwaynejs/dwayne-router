import { Block, If, Rest, DynamicBlock, Children, Elements } from 'dwayne';

const watchArgs = ($) => {
  const {
    name,
    ...rest
  } = $.args;

  return rest;
};

class RouteBlock extends Block {
  static html = html`
    <If if="{isCurrentRoute && Block}">
      <DynamicBlock
        type="{Block}"
        route="{routeParams}"
        router="{router}"
        Rest="{restArgs}"
      >
        <If if="{router._useOwnChildren}">
          <Children/>
        </If>
        <If if="{!router._useOwnChildren}">
          <Elements
            value="{route.childBlocks}"
            parentScope="{this}"
            parentTemplate="{this}"
          />
        </If>
      </DynamicBlock>
    </If>
  `;

  afterConstruct() {
    this.setRestArgs(
      this.evaluate(watchArgs, this.setRestArgs)
    );
  }

  setRestArgs = (rest) => {
    this.restArgs = rest;
  };

  beforeRemove() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export default RouteBlock;
