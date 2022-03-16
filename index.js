import { dataSource } from "./dataSource.js";
const data = dataSource.data;

const rootNode = { isRoot: true, children: [] };

dataToTree(rootNode, data);

const tree2Element = document.getElementById("tree2");
const tree3Element = document.getElementById("tree3");
const tree3ToRoot = document.getElementById("tree3-to-root");
tree3ToRoot.addEventListener("dragover", onDragOverToRootElement);
tree3ToRoot.addEventListener("dragleave", onDragLeaveToRootElement);
tree3ToRoot.addEventListener("drop", onDropToRootElement);

let dragState = {
  currentDragOverElement: null,
  sourceId: null,
};

renderAll(rootNode);

function renderAll(rootNode) {
  console.clear();
  outTreeToConsole(rootNode);
  tree2Element.innerHTML = outTreeToUlElementString(rootNode);
  while (tree3Element.firstChild) {
    tree3Element.firstChild.remove();
  }
  tree3Element.appendChild(outToUlElement(rootNode));
}

function outToUlElement(rootNode) {
  if (rootNode.children <= 0) {
    const liElement = document.createElement("li");
    liElement.draggable = true;
    liElement.addEventListener("dragstart", onDragLiElement);
    liElement.addEventListener("dragover", onDragOverLiElement);
    liElement.addEventListener("dragleave", onDragLeaveLiElement);
    liElement.addEventListener("drop", onDropLiElement);
    const spanTextElement = document.createElement("span");
    spanTextElement.appendChild(document.createTextNode(rootNode.name));
    liElement.appendChild(spanTextElement);
    const upButtonElement = document.createElement("button");
    upButtonElement.appendChild(document.createTextNode("▲"));
    upButtonElement.addEventListener("click", () => onCategorySeqUp(rootNode));
    liElement.appendChild(upButtonElement);
    const downButtonElement = document.createElement("button");
    downButtonElement.appendChild(document.createTextNode("▼"));
    downButtonElement.addEventListener("click", () =>
      onCategorySeqDown(rootNode)
    );
    liElement.appendChild(downButtonElement);
    liElement.id = rootNode.id;
    return liElement;
  }

  const rootElement = document.createElement(rootNode.isRoot ? "ul" : "li");
  if (!rootNode.isRoot) {
    rootElement.draggable = true;
    rootElement.addEventListener("dragstart", onDragLiElement);
    rootElement.addEventListener("dragover", onDragOverLiElement);
    rootElement.addEventListener("dragleave", onDragLeaveLiElement);
    rootElement.addEventListener("drop", onDropLiElement);
    const spanTextElement = document.createElement("span");
    spanTextElement.appendChild(document.createTextNode(rootNode.name));
    rootElement.appendChild(spanTextElement);
    const upButtonElement = document.createElement("button");
    upButtonElement.appendChild(document.createTextNode("▲"));
    upButtonElement.addEventListener("click", () => onCategorySeqUp(rootNode));
    rootElement.appendChild(upButtonElement);
    const downButtonElement = document.createElement("button");
    downButtonElement.appendChild(document.createTextNode("▼"));
    downButtonElement.addEventListener("click", () =>
      onCategorySeqDown(rootNode)
    );
    rootElement.appendChild(downButtonElement);
    rootElement.id = rootNode.id;
  }

  const childrenUlElement = rootNode.isRoot
    ? rootElement
    : document.createElement("ul");

  if (!rootNode.isRoot) rootElement.appendChild(childrenUlElement);

  for (const node of rootNode.children) {
    childrenUlElement.appendChild(outToUlElement(node));
  }

  return rootElement;
}

function outTreeToConsole(rootNode, level = 0) {
  if (!rootNode.isRoot) console.log(`${" ".repeat(level)}${rootNode.name}`);
  level++;
  for (const node of rootNode.children) {
    outTreeToConsole(node, level);
  }
}

function outTreeToUlElementString(rootNode) {
  let elementString = "";

  if (rootNode.children <= 0) return `<li>${rootNode.name}</li>`;

  for (const node of rootNode.children) {
    elementString += outTreeToUlElementString(node);
  }
  elementString = rootNode.isRoot
    ? `<ul>${elementString}</ul>`
    : `<li>${rootNode.name}<ul>${elementString}</ul></li>`;
  return elementString;
}

function dataToTree(rootNode, data) {
  const nodeList = data.map((d) => ({ ...d, children: [] }));
  for (const node of nodeList) {
    const parentNode = nodeList.find((n) => node.parentId == n.id);
    if (!parentNode) {
      rootNode.children.push(node);
      rootNode.children.sort((a, b) => a.id - b.id);
    } else {
      parentNode.children.push(node);
      parentNode.children.sort((a, b) => a.id - b.id);
    }
  }

  evaluateSeq(rootNode);
  return rootNode;
}

function findNode(rootNode, id) {
  if (!id) return null;
  if (rootNode.id === id) return rootNode;

  for (const node of rootNode.children) {
    const result = findNode(node, id);
    if (result) return result;
  }
  return null;
}

function moveCategory(rootNode, sourceId, targetId) {
  if (sourceId === targetId) return false;
  const sourceNode = findNode(rootNode, sourceId);
  const targetNode = findNode(rootNode, targetId);
  if (isParent(rootNode, targetNode, sourceNode)) return false;
  const oldParentNode = sourceNode.parentId
    ? findNode(rootNode, sourceNode.parentId)
    : rootNode;
  oldParentNode.children = oldParentNode.children.filter(
    (n) => n.id !== sourceId
  );
  sourceNode.parentId = targetNode.id;
  targetNode.children.push(sourceNode);
  return true;
}

function isParent(rootNode, childNode, guessNode) {
  let parent = findNode(rootNode, childNode.parentId);
  while (parent) {
    if (guessNode.id === parent.id) return true;
    parent = findNode(rootNode, parent.parentId);
  }
  return false;
}

function evaluateSeq(rootNode) {
  let count = 0;
  (function innerEvaluateSeq(rootNode) {
    rootNode.seq = count++;
    for (const node of rootNode.children) {
      innerEvaluateSeq(node);
    }
  })(rootNode);
}

function onDragLiElement(event) {
  event.dataTransfer.setData("sourceId", event.target.id);
  dragState.sourceId = event.target.id;
}

function onDragOverLiElement(event) {
  event.preventDefault();
  event.stopPropagation();
  const targetElement = event.target;
  const targetLiElement = targetElement.closest("li");
  targetLiElement.classList.add("on-drag");
  dragState.currentDragOverElement = targetLiElement;
}

function onDragLeaveLiElement(event) {
  event.preventDefault();
  event.stopPropagation();
  if (dragState.currentDragOverElement)
    dragState.currentDragOverElement.classList.remove("on-drag");
}

function onDropLiElement(event) {
  event.preventDefault();
  event.stopPropagation();
  if (dragState.currentDragOverElement)
    dragState.currentDragOverElement.classList.remove("on-drag");

  const sourceId = parseInt(dragState.sourceId);
  const targetId = parseInt(event.target.closest("li").id);
  if (moveCategory(rootNode, sourceId, targetId, dragState.up)) {
    evaluateSeq(rootNode);
    renderAll(rootNode);
  }
}

function onDragOverToRootElement(event) {
  event.preventDefault();
  event.stopPropagation();
  const targetElement = event.target;
  targetElement.className = "";
  targetElement.classList.add("tree3-to-root-hover");
}

function onDragLeaveToRootElement(event) {
  event.preventDefault();
  event.stopPropagation();
  const targetElement = event.target;
  targetElement.className = "";
  targetElement.classList.add("tree3-to-root-normal");
}

function onDropToRootElement(event) {
  event.preventDefault();
  event.stopPropagation();
  const sourceId = parseInt(dragState.sourceId);
  const sourceNode = findNode(rootNode, sourceId);
  const parentNode = findNode(rootNode, sourceNode.parentId);
  if (parentNode) {
    parentNode.children = parentNode.children.filter((n) => n.id !== sourceId);
  }

  if (sourceNode.parentId) {
    rootNode.children.push(sourceNode);
    sourceNode.parentId = null;
    evaluateSeq(rootNode);
    renderAll(rootNode);
  }

  const targetElement = event.target;
  targetElement.className = "";
  targetElement.classList.add("tree3-to-root-normal");
}

function onCategorySeqUp(node) {
  const parentNode = node.parentId
    ? findNode(rootNode, node.parentId)
    : rootNode;
  const nodeIndex = parentNode.children.findIndex((n) => n.id === node.id);
  if (nodeIndex <= 0) return;
  const temp = parentNode.children[nodeIndex - 1];
  parentNode.children[nodeIndex - 1] = node;
  parentNode.children[nodeIndex] = temp;
  evaluateSeq(rootNode);
  renderAll(rootNode);
}
function onCategorySeqDown(node) {
  const parentNode = node.parentId
    ? findNode(rootNode, node.parentId)
    : rootNode;
  const nodeIndex = parentNode.children.findIndex((n) => n.id === node.id);
  if (nodeIndex >= parentNode.children.length - 1) return;
  const temp = parentNode.children[nodeIndex + 1];
  parentNode.children[nodeIndex + 1] = node;
  parentNode.children[nodeIndex] = temp;
  evaluateSeq(rootNode);
  renderAll(rootNode);
}
