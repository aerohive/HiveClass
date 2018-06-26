/**
 * @module tree-controller
 */
var Montage = require("montage/core/core").Montage;
var WeakMap = require("montage/collections/weak-map");

/*
 NEW EXPERIMENTAL VERSION of TreeController, it will eventually be graduated
 to Montage.
 */

/**
 * @class TreeControllerNode
 * @extends Montage
 * @description A tree controller is a view-model that tracks whether each node in a
 * corresponding data-model is expanded or collapsed.  It also produces a
 * linearization of the visible iterations, transforming hierarchical nesting
 * into a flat, incrementally-updated array of iterations with the
 * corresponding indentation depth.
 * Bind a root node from the data model to a tree controller and bind the tree
 * controller's iterations to a content controller for a repetition.
 */
exports.TreeControllerNode = Montage.specialize({
    constructor: {
        value: function(controller, parent, content, depth, index) {
            var iterations = [],
                childrenPath,
                childrenContent;

            this._controller = controller;
            controller._nodeCount++;
            this.parent = parent;
            this.depth = depth;
            this.index = index || 0;
            if (controller.expandedPath && content[controller.expandedPath] !== undefined) {
                this._expanded = content[controller.expandedPath];
            } else {
                this._expanded = controller.initiallyExpanded || false;
            }

            if (this._expanded) {
                controller._expandedNodeCount++;
            }

            childrenPath = "content." + (controller.childrenPath||"children");
            this.content = content;
            this._ignoreChildrenContentChange = true;
            this._cancelChildrenContentChangeListener = this.addRangeAtPathChangeListener(
                childrenPath, this, "handleChildrenContentChange");
            this._ignoreChildrenContentChange = false;
            childrenContent = this.getPath(childrenPath);

            if (childrenContent) {
                this.children = this._createChildren(childrenContent, iterations);
            } else {
                this.children = [];
            }

            this.iterations = iterations;
        }
    },

    /**
     * The governing content controller
     */
    _controller: {
        value: null
    },

    /**
     * The data model corresponding to this node.
     */
    content: {
        value: null
    },

    /**
     * The number of times this node should be indented to reach its visually
     * representative depth.
     */
    depth: {
        value: null
    },

    /**
     * The position of this node within the parent node, as maintained by
     * bindings.
     */
    index: {
        value: null
    },

    /**
     * The node that is this node's parent, or null if this is the root node.
     */
    parent: {
        value: null
    },

    /**
     * The child nodes is an array of the corresponding tree controller
     * view-model node for each of the children.  The child nodes array
     * is maintained by `handleChildrenContentChange`.
     */
    children: {
        value: null
    },

    /**
     * The iterations array contains this node and all of its children beneath
     * expanded nodes.  It is maintained entirely by a binding that involves
     * this node, its child nodes, the iterations of its child nodes, and
     * whether this node is expanded.
     */
    iterations: {
        value: null
    },

    _expanded: {
        value: false
    },

    /**
     * The only meaningful user-defined state for this tree view, whether the
     * node is expanded (or collapsed).
     */
    expanded: {
        get: function() {
            return this._expanded;
        },
        set: function(value) {
            if (value !== this._expanded) {
                if (value) {
                    this._expanded = value;
                    this._expand();
                } else {
                    this._collapse();
                    // We need to collapse before setting expanded to false
                    // because the collapsing algorithm relies on this property
                    // to be true.
                    this._expanded = value;
                }
                this._controller.handleIterationsChange();
            }
        }
    },

    _createChildren: {
        value: function(childrenContent, iterations) {
            return childrenContent.map(function(childContent, index) {
                var child = new this.constructor(this._controller, this,
                    childContent, this.depth + 1, index);

                iterations.push(child);
                if (child.expanded) {
                    iterations.swap(iterations.length, 0, child.iterations);
                }

                return child;
            }, this);
        }
    },

    _destroy: {
        value: function() {
            this._controller._nodeCount--;
            if (this.expanded) {
                this._controller._expandedNodeCount--;
            }
            this._controller = null;
            this.parent = null;
            this._cancelChildrenContentChangeListener();
            this.content = null;

            for (var i = 0; i < this.children.length; i++) {
                this.children[i]._destroy();
            }
            this.children = null;
        }
    },

    _collapse: {
        value: function() {
            this._controller._expandedNodeCount--;
            this._removeIterationsFromParent(this.iterations.length, this);
        }
    },

    _expand: {
        value: function() {
            this._controller._expandedNodeCount++;
            this._addIterationsToParent(this.iterations, this);
        }
    },

    _addIterationsToParent: {
        value: function(iterations, previousIteration) {
            var parentIterations,
                parentIterationsIndex;

            if (this.expanded) {
                if (this.parent) {
                    parentIterations = this.parent.iterations;
                    parentIterationsIndex = parentIterations.indexOf(previousIteration) + 1;
                    parentIterations.swap(parentIterationsIndex, 0, iterations);
                    this.parent._addIterationsToParent(iterations, previousIteration);
                } else {
                    this._addIterationsToController(iterations, previousIteration);
                }
            }
        }
    },

    _removeIterationsFromParent: {
        value: function(iterationsCount, previousIteration) {
            var parentIterations,
                parentIterationsIndex;

            if (this.expanded) {
                if (this.parent) {
                    parentIterations = this.parent.iterations;
                    parentIterationsIndex = parentIterations.indexOf(previousIteration) + 1;
                    parentIterations.splice(parentIterationsIndex, iterationsCount);
                    this.parent._removeIterationsFromParent(iterationsCount, previousIteration);
                } else {
                    this._removeIterationsFromController(iterationsCount, previousIteration);
                }
            }
        }
    },

    _addIterationsToController: {
        value: function(iterations, previousIteration) {
            var controllerIterations = this._controller.iterations,
                parentIterationsIndex;

            parentIterationsIndex = controllerIterations.indexOf(previousIteration) + 1;
            controllerIterations.swap(parentIterationsIndex, 0, iterations);
        }
    },

    _removeIterationsFromController: {
        value: function(iterationsCount, previousIteration) {
            var controllerIterations = this._controller.iterations,
                parentIterationsIndex;

            parentIterationsIndex = controllerIterations.indexOf(previousIteration) + 1;
            controllerIterations.splice(parentIterationsIndex, iterationsCount);
        }
    },

    /**
     * Finds and return the node having the given content.
     * Takes an optional second argument to specify the compare function to use.
     * note: If you are doing find operations frequently, it might be better to attach
     * a binding that will facilitate incremental updates and O(1) lookups.
     * `nodeForContent <- nodes{[content, this]}.toMap()`
     */
    findNodeByContent: {
        value: function (content, equals) {
            equals = equals || Object.is;
            if (equals(this.content, content)) {
                return this;
            }
            var node;
            for (var i = 0; i < this.children.length; i++) {
                if (node = this.children[i].findNodeByContent(content, equals)) {
                    break;
                }
            }
            return node;
        }
    },

    /**
     * Performs a traversal of the tree, executes the callback function for each node.
     * The callback is called before continuing the walk on its children.
     */
    preOrderWalk: {
        value: function (callback) {
            callback(this);
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].preOrderWalk(callback);
            }
        }
    },

    /**
     * Performs a traversal of the tree, executes the callback function for each node.
     * The callback is called after continuing the walk on its children.
     */
    postOrderWalk: {
        value: function (callback) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].postOrderWalk(callback);
            }
            callback(this);
        }
    },

    _updateChildrenIndexes: {
        value: function(index) {
            var children = this.children;

            for (var i = index; i < children.length; i++) {
                children[i].index = i;
            }
        }
    },

    handleChildrenContentChange: {
        value: function(plus, minus, index) {
            var children = this.children,
                iterations = this.iterations,
                iterationsIndex,
                nextIterationsIndex,
                iterationsCount,
                child,
                nextChild,
                newChildren,
                removedChildren,
                newIterations;

            if (this._ignoreChildrenContentChange) {
                return;
            }

            if (minus.length > 0) {
                child = children[index];
                iterationsIndex = iterations.indexOf(child);
                nextChild = children[index + minus.length];
                nextIterationsIndex = iterations.indexOf(nextChild);

                if (iterationsIndex < 0) {
                    iterationsIndex = 0;
                }
                if (nextIterationsIndex < 0) {
                    nextIterationsIndex = iterations.length;
                }

                iterationsCount = nextIterationsIndex - iterationsIndex;
                removedChildren = this.children.splice(index, minus.length);
                this._updateChildrenIndexes(index);
                iterations.splice(iterationsIndex, iterationsCount);
                this._removeIterationsFromParent(iterationsCount, iterations[iterationsIndex - 1] || this);
                for (var i = 0; i < removedChildren.length; i++) {
                    removedChildren[i]._destroy();
                }
            }

            if (plus.length > 0) {
                nextChild = children[index];
                newIterations = [];

                newChildren = this._createChildren(plus, newIterations);
                this.children.swap(index, 0, newChildren);
                this._updateChildrenIndexes(index + plus.length);

                if (nextChild) {
                    iterationsIndex = iterations.indexOf(nextChild);
                } else {
                    iterationsIndex = iterations.length;
                }
                this.iterations.swap(iterationsIndex, 0, newIterations);
                this._addIterationsToParent(newIterations, iterations[iterationsIndex-1] || this);
            }

            this._controller.handleIterationsChange();
        }
    }
});

/**
 * @class TreeController
 * @extends Montage
 */
exports.TreeController = Montage.specialize(/** @lends TreeController# */ {
    constructor: {
        value: function TreeController(content, childrenPath, initiallyExpanded, expandedPath) {
            this.super();

            this._states = new WeakMap();
            this.childrenPath = childrenPath;
            this.initiallyExpanded = initiallyExpanded;
            this.expandedPath = expandedPath;
            this.content = content;
        }
    },

    /**
     * A by-product of the tree controller, the root node of the tree for the
     * current content.
     */
    root: {
        value: null
    },

    /**
     * A WeakMap of alternate [content, {root, nodeCount, expandedNodeCount}]
     * pairs. If the content is dropped, the view-model (tree controller nodes)
     * may be collected.  If a content references is restored, the corresponding
     * view model and all of its expanded/collapsed state, is restored.
     * @private
     */
    _states: {
        value: null
    },

    /**
     * An FRB expression, that evaluated against content or any of its
     * children, produces an array of that content's children.  By default,
     * this is simply "children", but for an alternate example, a binary tree
     * would have children `[left, right]`, except that said tree would need to
     * have no children if left and right were both null, so `(left ??
     * []).concat(right ?? [])`, to avoid infinite recursion.
     *
     * This property must be set before `content`.
     */
    childrenPath: {
        value: null
    },

    expandedPath: {
        value: null
    },

    /**
     * Whether nodes of the tree are initially expanded.
     *
     * This property must be set before `content`.  If `content` has already
     * set, use `allExpanded`.
     */
    initiallyExpanded: {
        value: null
    },

    /**
     * The product of a tree controller, an array of tree controller nodes
     * corresponding to each branch of the content for which every parent node
     * is `expanded`.
     */
    iterations: {
        value: void 0
    },

    _nodeCount: {
        value: 0
    },

    _expandedNodeCount: {
        value: 0
    },

    _content: {
        value: null
    },

    content: {
        get: function() {
            return this._content;
        },
        set: function(value) {
            if (value !== this._content) {
                // save state for the current content
                if (this._content) {
                    this._saveState();
                }
                this._content = value;
                if (value) {
                    if (this._states.has(value)) {
                        this._restoreState(value);
                    } else {
                        this._nodeCount = 0;
                        this._expandedNodeCount = 0;
                        this.root = new this.ControllerNode(this, null, value, 0);
                    }

                    var iterations = [this.root];
                    if (this.root.expanded) {
                        iterations.swap(1, 0, this.root.iterations);
                    }
                    this.iterations = iterations;
                } else {
                    this.root = null;
                    this.iterations = void 0;
                }
                this.handleIterationsChange();
            }
        }
    },

    /**
     * Saves the content to tree controller root nodes and other state
     * properties, using the `_states` `WeakMap` to retain
     * `expanded` / collapsed state.
     * @private
     */
    _saveState: {
        value: function() {
            this._states.set(
                this._content, {
                    root: this.root,
                    _nodeCount: this._nodeCount,
                    _expandedNodeCount: this._expandedNodeCount
                }
            );
        }
    },

    /**
     * Restores the tree controller to the state that was previously saved for
     * a specific content.
     */
    _restoreState: {
        value: function(content) {
            var state = this._states.get(content);
            this.root = state.root;
            this._nodeCount = state._nodeCount;
            this._expandedNodeCount = state._expandedNodeCount ;

        }
    },

    _allExpanded: {
        value: null
    },

    /**
     * Whether every node eligible for expansion is expanded.
     *
     * This is a readable and writable property.  Setting to true causes all
     * nodes to be expanded.
     */
    allExpanded: {
        get: function() {
            return this._allExpanded;
        },
        set: function(value) {
            if (value !== this._allExpanded) {
                if (value) {
                    this.preOrderWalk(function(node) {
                        node.expanded = true;
                    });
                }
                this._allExpanded = value;
            }
        }
    },

    _noneExpanded: {
        value: null
    },

    /**
     * Whether any nodes are collapsed.
     *
     * This is a readable and writable property.  Setting to true causes all
     * nodes to be collapsed.
     */
    noneExpanded: {
        get: function() {
            return this._noneExpanded;
        },
        set: function(value) {
            if (value !== this._noneExpanded) {
                if (value) {
                    // Have to do it manually otherwise it's too slow.
                    this.preOrderWalk(function(node) {
                        node._expanded = false;
                        node.iterations = node.children.slice(0);
                    });
                    this._expandedNodeCount = 0;
                    this.iterations.splice(1, this.iterations.length - 1);
                    this.handleIterationsChange();
                }
                this._noneExpanded = value;
            }
        }
    },

    _changeOwnProperty: {
        value: function(propertyName, value) {
            if (value !== this[propertyName]) {
                this["_"+propertyName] = value;
                this.dispatchOwnPropertyChange(propertyName, value);
            }
        }
    },

    handleIterationsChange: {
        value: function() {
            if (this.iterations) {
                this._changeOwnProperty("allExpanded", this.iterations.length === this._nodeCount);
            }
            this._changeOwnProperty("noneExpanded", this._expandedNodeCount === 0);
        }
    },

    ControllerNode: {
        value: exports.TreeControllerNode
    },

    /**
     * Finds and returns the node having the given content.
     * Takes an optional second argument to specify the compare function to use.
     * note: If you are doing find operations frequently, it might be better to attach
     * a binding that will facilitate incremental updates and O(1) lookups.
     * `nodeForContent <- nodes{[content, this]}.toMap()`
     */
    findNodeByContent: {
        value: function(content, equals) {
            if (this.root) {
                return  this.root.findNodeByContent(content, equals);
            }
            else {
                return null;
            }
        }
    },

    /**
     * Performs a traversal of the tree, executes the callback function for each node.
     * The callback is called before continuing the walk on its children.
     */
    preOrderWalk: {
        value: function(callback) {
            if (this.root) {
                this.root.preOrderWalk(callback);
            }
        }
    },

    /**
     * Performs a traversal of the tree, executes the callback function for each node.
     * The callback is called after continuing the walk on its children.
     */
    postOrderWalk: {
        value: function(callback) {
            if (this.root) {
                this.root.postOrderWalk(callback);
            }
        }
    },
    _selection: {
        value: null
    },

    /**
     * Whether every node eligible for expansion is expanded.
     *
     * This is a readable and writable property.  Setting to true causes all
     * nodes to be expanded.
     */
    selection: {
        get: function() {
            return this._selection;
        },
        set: function(value) {
            this._selection = value;
        }
    },

}, {

    blueprintModuleId: require("montage")._blueprintModuleIdDescriptor,

    blueprint: require("montage")._blueprintDescriptor

});
