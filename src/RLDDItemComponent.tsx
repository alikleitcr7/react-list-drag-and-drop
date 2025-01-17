import * as React from "react";
import RLDDLogic from "./RLDDLogic";
import { Rect } from "./Geometry";

export interface RLDDItemProps {
  logic: RLDDLogic;
  itemId: number | string;
  activity: boolean;
  dragged: boolean;
  hovered: boolean;
}

export interface RLDDItemState {
  isDragging: boolean;
}

export default class RLDDItemComponent extends React.Component<
  RLDDItemProps,
  RLDDItemState
> {
  readonly state: RLDDItemState = { isDragging: false };
  private isDown: boolean = false;
  private mouseDownTimestamp: number = 0;
  private initialOffset: { x: number; y: number };

  // private ref: React.RefObject<HTMLDivElement>;
  private containerElement:
    | React.RefObject<HTMLDivElement>
    | undefined = undefined;

  constructor(props: RLDDItemProps) {
    super(props);
    this.initialOffset = { x: 0, y: 0 };
    this.containerElement = React.createRef<HTMLDivElement>();

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    // this.ref = React.createRef();
  }

  componentDidMount() {
    this.props.logic.setItemIdBoxRect(this.props.itemId, this.getBox());
  }

  componentDidUpdate(prevProps: RLDDItemProps, prevState: RLDDItemState) {
    if (!this.state.isDragging && prevState.isDragging) {
      this.removeDocumentListeners();
    }
    this.props.logic.setItemIdBoxRect(this.props.itemId, this.getBox());
  }

  componentWillUnmount() {
    this.removeDocumentListeners();
  }

  render() {
    // console.log('RLDDItemComponent.render');
    const dragged = this.props.dragged ? "dragged" : "";
    const hovered = this.props.hovered ? "hovered" : "";
    const activity = this.props.activity ? "activity" : "";
    const cssClasses = "dl-item " + activity + " " + dragged + " " + hovered;
    return (
      <div
        ref={this.containerElement}
        onMouseDown={this.handleMouseDown}
        className={cssClasses}
      >
        {this.props.children}
      </div>
    );
  }

  /////

  private addDocumentListeners() {
    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("mousemove", this.handleMouseMove);
  }

  private removeDocumentListeners() {
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("mousemove", this.handleMouseMove);
  }

  /////

  private handleMouseDown(e: React.MouseEvent<HTMLElement>) {
    this.isDown = true;
    this.mouseDownTimestamp = new Date().getTime();
    this.initialOffset = this.getOffset(e);
    e.preventDefault();
    this.addDocumentListeners();
  }

  private handleMouseMove(e: MouseEvent) {
    if (
      this.isDown === false ||
      this.getTimeSinceMouseDown() < this.props.logic.getDragDelay()
    ) {
      return;
    }

    const offset = {
      x: e.x - this.initialOffset.x,
      y: e.y - this.initialOffset.y,
    };

    if (this.state.isDragging === false && this.isDown) {
      this.props.logic.handleDragBegin(this.props.itemId);
    }
    this.setState(Object.assign(this.state, { isDragging: this.isDown }));
    this.props.logic.handleDragMove(this.props.itemId, offset);
  }

  private getTimeSinceMouseDown(): number {
    return new Date().getTime() - this.mouseDownTimestamp;
  }

  private handleMouseUp() {
    this.isDown = false;
    if (this.state.isDragging) {
      this.setState(Object.assign(this.state, { isDragging: this.isDown }));
      this.props.logic.handleDragEnd();
    }
  }

  private getBox(): Rect {
    const ref = this.containerElement;
    console.log({ ref: ref ? (ref.current ? "cu" : "no") : "no" });

    if (ref && ref.current) {
      const element = ref.current.getBoundingClientRect();

      return element;
    }

    return { top: 0, left: 0, width: 0, height: 0 };
  }

  private getOffset(e: {
    pageX: number;
    pageY: number;
  }): { x: number; y: number } {
    const box = this.getBox();
    const docElement = document.documentElement;
    return {
      x: e.pageX - (box.left + docElement.scrollLeft - docElement.clientLeft),
      y: e.pageY - (box.top + docElement.scrollTop - docElement.clientTop),
    };
  }
}
