// ____________BINARY______________________
function BinaryOperation(left, right, sign, func) {
    this.left = left;
    this.right = right;
    this.sign = sign;
    this.func = func
}

BinaryOperation.prototype.toString = function () {
    return this.left.toString() + " " + this.right.toString() + " " + this.sign;
}

BinaryOperation.prototype.prefix = function () {
    return "(" + this.sign + " " + this.left.prefix() + " " + this.right.prefix() + ")";
}

BinaryOperation.prototype.evaluate = function (x, y, z) {
    return this.func(this.left.evaluate(x, y, z), this.right.evaluate(x, y, z));
}

function Add(left, right) {
    BinaryOperation.call(this, left, right, "+", (a, b) => (a + b));
}

Add.prototype = Object.create(BinaryOperation.prototype);

Add.prototype.diff = function (name) {
    return new Add(this.left.diff(name), this.right.diff(name));
}

function Subtract(left, right) {
    BinaryOperation.call(this, left, right, "-", (a, b) => (a - b));
}

Subtract.prototype = Object.create(BinaryOperation.prototype);

Subtract.prototype.diff = function (name) {
    return new Subtract(this.left.diff(name), this.right.diff(name));
}

function Multiply(left, right) {
    BinaryOperation.call(this, left, right, "*", (a, b) => (a * b));
}

Multiply.prototype = Object.create(BinaryOperation.prototype);

Multiply.prototype.diff = function (name) {
    return new Add(new Multiply(this.left.diff(name), this.right),
        new Multiply(this.left, this.right.diff(name)));
}

function Divide(left, right) {
    BinaryOperation.call(this, left, right, "/", (a, b) => (a / b));
}

Divide.prototype = Object.create(BinaryOperation.prototype);

Divide.prototype.diff = function (name) {
    return new Divide(new Subtract(new Multiply(this.left.diff(name), this.right),
        new Multiply(this.left, this.right.diff(name))), new Multiply(this.right, this.right));
}


function ArcTan2(x, y) {
    BinaryOperation.call(this, x, y, "atan2", (x, y) => Math.atan2(x, y))
}

ArcTan2.prototype = Object.create(BinaryOperation.prototype);

ArcTan2.prototype.diff = function (name) {
    return new Add(new Divide(new Multiply(new Negate(this.left), this.right.diff(name)),
        new Add(new Multiply(this.left, this.left), new Multiply(this.right, this.right))),
        new Divide(new Multiply(this.right, this.left.diff(name)),
            new Add(new Multiply(this.left, this.left), new Multiply(this.right, this.right))))
}


// ___________UNARY_____________

function UnaryOperation(a, func, sign) {
    this.a = a;
    this.func = func;
    this.sign = sign;
}

UnaryOperation.prototype.evaluate = function (x, y, z) {
    return this.func(this.a.evaluate(x, y, z));
}

UnaryOperation.prototype.toString = function () {
    return this.a + " " + this.sign;
}

UnaryOperation.prototype.prefix = function () {
    return "(" + this.sign + " " + this.a.prefix() + ")";
}

function Negate(a) {
    UnaryOperation.call(this, a, a => -a, "negate");
}

Negate.prototype = Object.create(UnaryOperation.prototype);

Negate.prototype.diff = function (name) {
    return new Negate(this.a.diff(name));
}

function Sinh(a) {
    UnaryOperation.call(this, a, a => Math.sinh(a), "sinh");
}

Sinh.prototype = Object.create(UnaryOperation.prototype);

Sinh.prototype.diff = function (name) {
    return new Multiply(new Cosh(this.a), this.a.diff(name));
}

function Cosh(a) {
    UnaryOperation.call(this, a, a => Math.cosh(a), "cosh");
}

Cosh.prototype = Object.create(UnaryOperation.prototype);

Cosh.prototype.diff = function (name) {
    return new Multiply(new Negate(Sinh(this.a)), this.a.diff(name));
}

function Variable(c) {
    this.c = c;
}

Variable.prototype.toString = function () {
    return this.c.toString();
}

Variable.prototype.prefix = function () {
    return this.c.toString();
}

Variable.prototype.evaluate = function (x, y, z) {
    if (this.c === "x") {
        return x;
    } else if (this.c === "y") {
        return y;
    } else if (this.c === "z") {
        return z;
    }
}
Variable.prototype.diff = function (name) {
    if (this.c === name) {
        return new Const(1);
    } else return new Const(0);
}

function Const(value) {
    this.value = value;
}

Const.prototype.toString = function () {
    return this.value.toString();
}

Const.prototype.prefix = function () {
    return this.value.toString();
}

Const.prototype.evaluate = function (x, y, z) {
    return this.value;
}
Const.prototype.diff = function (x) {
    return new Const(0);
}

function ArcTan(x) {
    UnaryOperation.call(this, x, x => Math.atan(x), "atan");
}

ArcTan.prototype = Object.create(UnaryOperation.prototype);

ArcTan.prototype.diff = function (name) {
    return new Multiply(new Divide(new Const(1), new Add(new Const(1),
        new Multiply(this.a, this.a))), this.a.diff(name))
}

const OP = {
    "+": Add,
    "-": Subtract,
    "*": Multiply,
    "/": Divide,
};

const UnOP = {
    "negate": Negate,
    "sinh": Sinh,
    "cosh":Cosh
};

function eos(pos, exp) {
    return pos >= exp.length;
}

function delWhiteSpace(pos, exp) {
    while (pos < exp.length && exp[pos] === " ") {
        pos++;
    }
    return pos;
}

function createOperation(left, right, sign) {
    return new OP[sign](left, right);
}


function parse(exp) {
    let pos = 0;
    let stack = [];

    while (!eos(pos, exp)) {
        pos = delWhiteSpace(pos, exp);
        if (exp[pos] === 'x' || exp[pos] === 'y' || exp[pos] === 'z') {
            stack.push(new Variable(exp[pos]));
            pos++;
        } else if (exp[pos] >= '0' && exp[pos] <= '9' ||
            exp[pos] === '-' && exp[pos + 1] >= '0' && exp[pos + 1] <= '9') {
            let startPos = pos;
            while (!eos(pos, exp) && exp[pos] >= '0' && exp[pos] <= '9' || exp[pos] === '-') {
                pos++;
            }
            stack.push(new Const(parseInt(exp.substring(startPos, pos))));
        } else if (exp.startsWith("negate", pos)) {
            pos += 6;
            let result = stack.pop();
            stack.push(new Negate(result));
        } else if (exp.startsWith("atan2", pos)) {
            pos += 5;
            let second = stack.pop();
            let first = stack.pop();
            stack.push(new ArcTan2(first, second));
        } else if (exp.startsWith("atan", pos)) {
            pos += 4;
            let result = stack.pop();
            stack.push(new ArcTan(result));
        } else if (exp[pos] in OP) {
            let sign = exp[pos];
            pos++;
            let second = stack.pop();
            let first = stack.pop();
            stack.push(createOperation(first, second, sign));
        }
    }
    return stack.pop();
}


function parsePrefix(exp) {
    // console.log(exp)
    let pos = 0;
    let stack = [];
    let balance = 0;
    let t = false

    if (exp. length === 0){
        throw new  Error("Incorrect expression");
    }

    if (exp=== "(x)" || exp === "(0)"){
        throw new  Error("Incorrect expression");
    }

    function checkBalance() {
        return balance >= 0;
    }

    function constOrVar() {
        while (stack.length > 1) {
            if (stack[stack.length - 2] in UnOP) {
                let a = stack.pop();
                let sign = stack.pop();
                stack.push(new UnOP[sign](a));
            } else if (!(stack[stack.length - 2] in OP)) {
                let second = stack.pop();
                let first = stack.pop();
                if (stack.length===0){
                    throw new Error("Illigal expression")
                }
                let sign = stack.pop();
                stack.push(createOperation(first, second, sign));
            } else {
                break;
            }
        }
    }

    while (!eos(pos, exp)) {
        pos = delWhiteSpace(pos, exp);
        if (exp[pos] === 'x' || exp[pos] === 'y' || exp[pos] === 'z') {
            stack.push(new Variable(exp[pos]));
            pos++;
            constOrVar();
        } else if (exp[pos] >= '0' && exp[pos] <= '9' ||
            exp[pos] === '-' && exp[pos + 1] >= '0' && exp[pos + 1] <= '9') {
            let startPos = pos;
            while (!eos(pos, exp) && exp[pos] >= '0' && exp[pos] <= '9' || exp[pos] === '-') {
                pos++;
            }
            stack.push(new Const(parseInt(exp.substring(startPos, pos))));
            constOrVar();
        } else if (exp.startsWith("negate", pos)) {
            pos += 6;
            stack.push("negate");
        } else if (exp.startsWith("sinh", pos)) {
            pos += 4;
            stack.push("sinh");
        } else if (exp.startsWith("cosh", pos)) {
            pos += 4;
            stack.push("cosh");
        } else if (exp[pos] in OP) {
            stack.push(exp[pos]);
            pos++;
        } else if (exp[pos] === "(" || exp[pos] === ")") {
            t = true
            if (exp[pos] === "(") {
                balance += 1;
            } else {
                balance -= 1;
            }
            pos++;
            if (!checkBalance()) {
                throw new Error("No opening '('");
            }
        } else if (!eos(pos, exp)) {
            throw new Error("Illigal symbol");
        }
    }
    if (balance >= 1) {
        throw new Error("No closing ')'");
    }
    if (stack.length > 1) {
        throw new Error("The mistake in number of arguments");
    } else if (stack.length === 0 || stack[0] in OP || stack[0] in UnOP) {
        throw new Error("Incorrect input")
    } else if(t && stack[0] === Variable("x") ){
        throw new Error("Incorrect input")
    } else {
        return stack.pop()
    }
}

 // console.log(parsePrefix('(x )'))







