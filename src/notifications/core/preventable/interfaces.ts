
export interface IPreventableConstructor {
  new<N extends string>(): IPreventable<N>;
}

/**
 * A Preventable is simply an object used to 'prevent' some action.
 * It may be used in conjunction with Notification, NotificationsObservable and NotificationsObserver
 */
export interface IPreventable<N extends string> {
  /**
   * Returns true if 'name' has been prevented in the context of this Preventable
   * @param name
   */
  isPrevented(name: N): boolean;

  /**
   * Prevents 'name' in the context of this Preventable => `isPrevented(name)` becomes true
   * @param name
   */
  prevent(name: N): this;
}

/*------------------------*/

export interface IBasicPreventableConstructor {
  new(): IBasicPreventable;
}

/**
 * Like Preventable but 'name' is not required
 */
export interface IBasicPreventable extends IPreventable<'default'> {
  isPrevented(): boolean;

  prevent(): this;
}


/*
// Example

interface DOMInsert {
  node: Node;
  parent: Node;
  beforeTarget: Node | null;
  preventable: IBasicPreventable;
}

interface InsertKVMap {
  'insert': DOMInsert;
}


export function preventableExample(): void {
  type InsertFunction = (node: Node, parent: Node, beforeTarget?: Node | null) => void;


  /!**
   * This function creates a couple [insert, observe insert],
   * Allowing to prevent insertions
   *!/
  function DOMInsert(): [InsertFunction, INotificationsObservable<InsertKVMap>] {
    let insertFunction: InsertFunction;

    const insertObservable: INotificationsObservable<InsertKVMap> = new NotificationsObservable<InsertKVMap>((context: INotificationsObservableContext<InsertKVMap>) => {
      insertFunction = (node: Node, parent: Node, beforeTarget: Node | null = null) => { // when inserting a node in the dom
        const action: DOMInsert = Object.freeze({
          node: node,
          parent: parent,
          beforeTarget: beforeTarget,
          preventable: new BasicPreventable(),
        });
        // dispatch the action, and allow the insertion to be prevented
        context.dispatch('insert', action);
        if (!action.preventable.isPrevented()) { // if not prevented, inset the node in the DOM
          parent.insertBefore(node, beforeTarget);
        }
      };
    });

    return [
      // @ts-ignore
      insertFunction,
      insertObservable,
    ]
  }

  const [insert, observable] = DOMInsert();

  observable
    .on('insert', (action: DOMInsert) => { // subscribe to the 'insert' event
      if ((action.node.nodeType === Node.ELEMENT_NODE) && ((action.node as Element).tagName === 'img')) { // if inserted node is an Element and its tag name is 'img', prevent the insertion (so no img may be inserted)
        action.preventable.prevent();
      } else if (action.node.nodeType === Node.COMMENT_NODE) { // if inserted node is as comment, insert a custom 'comment' element instead
        action.preventable.prevent();
        const element = document.createElement('comment');
        element.innerText = (action.node as Comment).data;
        action.parent.insertBefore(element, action.beforeTarget);
      }
    });


  insert(document.createElement('div'), document.body); // inserted in the DOM
  insert(document.createElement('img'), document.body); // prevented => not-inserted in the DOM
  insert(document.createComment('my-comment'), document.body); // prevented => not-inserted in the DOM, replaced by <comment>my-comment</comment>

}
*/
