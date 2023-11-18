# Rholang

![CHEATSHEET](https://rholang.github.io/assets/static/cheat-sheet.cbab2cf.2442127b2773a251ac152103d83b4dc8.png)

[TOC]

## Sending

### Say hello
```c++
new stdout(`rho:io:stdout`) in {
  stdout!("Hello World!")
}
```

### Stdout
Rholang的核心是在信道(channel)上进行沟通，信道也就是我们用来发送与接受信息(message)的工具。而向信道上发送信息，我们采用 `!` 运算符。而 `stdout` 信道的创建让我们能够在控制台看到输出信息。而同时存放这些message的地方叫做元组空间(tuplespace)。

### Concurency

```c++
new chan1, stdout(`rho:io:stdout`) in {
  stdout!("I'm on the screen")
  |
  chan1!("I'm in the tuplespace")
}
```

`|` 运算符被称为'parallel'，也可以称作并行运算符。

## Receiving

### Check for messages

一般而言，调用message的表达式如下：

```c++
for(message <- channel){
  // Do something here
}
```

当一些message从channel中传出(show up)，那么message就进入了received状态。在花括号 `{}` 中的代码被称为continuation，它们会在message被received时被调用运行。其中的 `//` 为注释。

### Comm Events

以下的代码段向 `pizzaShop` 这个channel发送message，而这个channel在接收到信息后会将打印 `Order Received.` 

```c++
new pizzaShop, stdout(rho:io:stdout) in { 
    pizzaShop!("2 medium pies") 
    | 
    for(order <- pizzaShop){ 
        stdout!("Order Received.") 
    } 
}
```

#### Receiving Before Sending

当发送与接受在同一个信道中发生，它被称为一个 `comm event`。

### Contracts
智能合约能够让我们在部署一次代码之后，实现每次接收到信息时自动运行。

```c++
new coffeeShop, stdout(`rho:io:stdout`) in {
  contract coffeeShop(order) = {
    stdout!("Coffee Order Received")
  }
  |
  coffeeShop!("one hot chocolate")
  |
  coffeeShop!("two large cappuccinos please")
}
```

#### Persistent

实际上，Rholang中有两种不同风格的表达式来实现这种持久化行为。而现在我们可以认为以下两种形式是等价的，它们只在我们讨论区块链时有所不同：

```contract coffeeShop(order) = {```
```for(order <= coffeeShop) {```

注意到第二种方式与此前使用 `for` 的方式有所不同，在这里我们使用 `<=` 而不是 `<-` 。

## Names And Processes

### Message Relaying

```c++
new alice, bob, stdout(`rho:io:stdout`) in {
  // Start the game by sending a message to Alice
  alice!("How to program: Change stuff and see what happens.")
  |

  // Concurrently, Alice listens for the message
  for (message <- alice) {

    // When she receives the message she'll pass it on to Bob
    bob!(*message)
  }
  |

  // Concurrently, Bob will listens for the message
  for (message <- bob) {
    // Bob is the last player, so he'll announce the message
    stdout!(*message)
  }
}
```

### \*
在Rholang中有两种事务，为'channel'和'process'，而我们也可以通过特定方式转换它们。

一个'process'是任何rho代码片段，甚至可以仅仅是表示值(value)的代码。以下是一些示例：

```
stdout!("Sup Rholang?") //A common send
Nil //The smallest possible process. It literally means "do nothing".
for(msg <- phone){Nil} //A common receive that does nothing when a message arrives.
"Hello World" //Another small process that also does nothing. These are called "Ground Terms".
```

我们可以用 `@` 符号将process转为channel(也称name)。我们也可以用 `*` 将name转回process。

还有非常重要的一点是，在Rholang中我们**发送processes而接受names**。

## Send and Peek

### Send Repeadtedly
我们的披萨和咖啡店都希望在同一可重复使用的信道上接收许多消息。我们以持续的`(msg <= chan){...}`或合约`Chan(msg){...}`来实现这一目标。

空中交通管制塔可能有兴趣做相反的事情——一遍又一遍地发送相同的信息。塔台的管制员希望记录一次包含天气和跑道动态信息的信息，并将其提供给每一位需要的飞行员。就像披萨店一样，他们很忙，每次飞行员使用信息时，他们都会不断地重新发送信息。

#### Persistent send syntax
对于上述的控制塔，它只需要修改一点点代码即可实现持续的发送同一个消息(也就是使用`!!`而不是`!`)：

```c++
new airportInfo, stdout(`rho:io:stdout`) in {
  // ATC sends the info
  airportInfo!!("No wind; Runway 11")
  |
  // Pilot receives the info
  for (info <- airportInfo) {
    stdout!(*info)
  }
}
```

#### Double Checking a Message

持久的发送和接收非常有用，正如我刚刚展示的那样。但通常正常的发送和接收也很有用。想象一下，当天气变化时，空中交通管制员想要更新机场信息。如果他们使用持久发送，则无法进行更新。

一种更好的解决方式是使用常规的发送，并要求每个收到消息的飞行员在使用完毕消息后将消息放回信道。

```c++
new airportInfo, stdout(`rho:io:stdout`) in {
  // ATC sends the info
  airportInfo!("No wind; Runway 11")
  |

  // Pilot receives the info
  for (info <- airportInfo) {
    stdout!(*info)
    // TODO Pilot MUST put the info back
  }
  |

  // ATC later records a new message
  for (oldInfo <- airportInfo) {
    airportInfo!("Wind 3 knots; Runway 11")
  }
}
```

### Peek Syntax
上面代码的一个问题是，健忘的飞行员可能不会真正将信息放回`airportInfo`信道，这会给其他需要信息的飞行员带来问题。更好的解决方案是一开始就不要真正从信道外接收消息。

要在不取出信道内容的情况下"窥探"信道上的内容，使用`<<-`运算符。

```c++
new airportInfo, stdout(`rho:io:stdout`) in {
  // ATC sends the info
  airportInfo!("No wind; Runway 11")
  |

  // Pilot receives the info
  // use a `<<-` there
  for (info <<- airportInfo) {
    stdout!(*info)
  }
  |

  // ATC later records a new message
  for (oldInfo <- airportInfo) {
    airportInfo!("Wind 3 knots; Runway 11")
  }
}
```

## Join
有时，只有在从两个或多个不同的数据源检索到数据(接收到消息)后才能进行计算。例如，在得到彩票号码和中奖号码之前，你无法判断自己是否中了彩票。在你知道价格和投标金额之前，你不能更改购买。在你知道每个选手完成了多少个俯卧撑之前，你无法判断谁赢得了俯卧撑比赛。

### Multiple data sources
Rholang拥有适用于这种情况的联接运算符。要执行联接，只需使用`;`运算符。

```c++
for (p1Pushups <- player1; p2Pushups <- player2) {
  stdout!("The winner is...")
}
```

需要注意的是，当我们使用联接运算符，只有当所有messages都可用的时候message才会被接收。

#### Rocket Launch
一家太空探索公司希望确保他们的火箭只有在两名飞行工程师Alice和Bob都下达发射命令时才能发射。例如，Bob会发送`bobLaunch!`。当两位工程师都发出命令时，火箭就可以发射了。

##### The wrong way

```c++
// Listen for Alice's then Bob's launch commands
  for (x <- aliceLaunch){
    for (y <- bobLaunch){
      stdout!("Launching the rocket")
    }
  }
```

在这种解决方案中，Alice将不能在中途修改她的想法，这是不合适的，我们应该采用 `;` 来解决这个问题。

##### Launch Solution

```c++
new aliceLaunch, bobLaunch, stdout(`rho:io:stdout`) in {
  // Listen for both launch commands
  for (x <- aliceLaunch; y <- bobLaunch){
    stdout!("Launching the rocket")
  }
  |
  // When ready, Engineers send their commands
  aliceLaunch!("launch")
  |
  bobLaunch!("launch")
}
```

## Unforgable Names
我们已经学习了如何使用`for`和`contract`接收消息。这两种构造都"绑定"变量。如果变量附加了一个实际值(信道或进程)，则该变量被视为绑定变量。

### Bound and Free Variables
而在Rholang中，以前面提到的咖啡店为例，`order`一开始为自由变量，但它在有信息传入`coffeeShop`的时候被绑定。

```c++
for (order <= coffeeShop) {
  stdout!("Coffee Order Received")
}
// or the same is true when we use contracts.
contract coffeeShop(order) = {
  stdout!("Coffee Order Received")
}
```

### The `new` Operator

我们可以发现，`new`运算符同样也可以绑定变量。

```c++
new pizzaShop, stdout(`rho:io:stdout`) in {

  // Same contract as before
  contract pizzaShop(order) = {
    stdout!("Order Received.")
  }
  |
  // Known customers can order because pizzaShop is bound here.
  pizzaShop!("Extra bacon please")
  |
  pizzaShop!("Hawaiian Pizza to go")
}
```

而当我们试着在`new`限制之外点一份披萨，会发生顶层自由变量的错误。
在rholang中，使用`new`创建的channel不允许访问它们引用的底层process。如果你愿意，你可以把它们看作是"纯粹的信道"。

### Private vs Unforgeable

`new`被称为限制运算符，因为它将创建的绑定名称的使用限制在大括号或"词法范围"内。在rholang的世界里，这些新名称实际上只在正确的范围内可见，但请记住，人类程序员可以从外部观察这个世界。在区块链环境中工作时尤其如此。

因此，虽然竞争对手的披萨店(从花括号外)不能消费为我们店准备的披萨订单，但他们仍然可以使用区块浏览器读取订单。程序员偶尔会称`new`名称为"私有"，但更好的术语是"不可伪造"(unforgetable)。

### Acknowledgement Channels
unforgeable names的一个常见用法是"acknowledgement channels"，通常简称为"ack"通道。披萨店不应该通过打印到屏幕上来确认订单，打扰所有人，而应该让顾客知道订单已经下了。要做到这一点，披萨店需要知道如何联系顾客。因此，客户应该提供一个确认通道，以便回电。传统上，这样的通道被命名为`ack`。

```c++
new alice, bob, pizzaShop in {

  // Now we take an order and an ack channel
  contract pizzaShop(order, ack) = {
    // Instead of acknowledging via stdout, we use ack
    ack!("Order Received.")
  }
  |

  // Known customers can order because pizzaShop is bound here.
  pizzaShop!("Extra bacon please", *alice)
  |
  pizzaShop!("Hawaiian Pizza to go", *bob)
}
```

#### Sending Names Gives Permission
我们刚刚看到客户如何给商店一个ack信道来接收订单确认。根据我们之前的代码，Bob可以通过她的ack信道联系Alice。这意味着Bob可以发送一个伪造的ack，让Alice认为订单已经下了，而事实并非如此。实际上Alice和Bob应该严格控制他们不可伪造的名字。因为这个稳定的名字会让双方有能力进行沟通。

```c++
new pizzaShop in {

  // Take orders and acknowledge them
  contract pizzaShop(order, ack) = {
    ack!("Order Received.")
  }
  |
  
  // Order a pizza and send a private ack channel.
  new alice in {
    pizzaShop!("One medium veggie pizza", *alice)
  }
}
```

解决方案是创建一个新的unforgeable name，然后将它传入pizzaShop合约从而使得pizzaShop可以调用这个名字。但是在这个例子中，我们选择相信shop只能在ack通道上发送，但请注意，如果它愿意，它也可以接收。我们将在下一节关于bundles的内容中学习如何只发送其中的一些权限。

#### `stdoutAck` and `stderrAck`

```c++
new myAckChannel,
    stdout(`rho:io:stdout`),
    stdoutAck(`rho:io:stdoutAck`) in {
    
  stdoutAck!("Print some words.", *myAckChannel)
  |
  for (acknowledgement <- myAckChannel) {
    stdout!("Received an acknowledgement.")
  }
}
```

值得注意的是，少数东西总是以新的元组空间开始，其中四个是用于屏幕打印通道的内置接收器。其他的用于cryptography。

## Bundles Interpolation

### Stolen Messages
Alice是一个正在崛起的名人，她收到粉丝们的来信。他们过去常常直接给她寄邮件。

但随着她越来越受欢迎，嫉妒她的竞争对手Eve开始偷她的邮件。

问题是，竞争对手可以收听Alice可以收听的同一频道。因此，她真正需要的是让她的粉丝们拥有一个"write-only bundle"

```c++
new alice, bob, eve, stdout(`rho:io:stdout`) in {
  // Alice gets a lot of fan mail, so she
  // creates a new write only bundle and publishes it.
  new aliceFanMail in {

    // Alice gives fanmail channel publicly
    alice!!(bundle+ {*aliceFanMail})
    |

    // Alice also reads fan mail
    for (mail <= aliceFanMail) {
      stdout!("Alice received a fanmail")
    }
  }
  |

  // When Bob wants to send fanmail he asks for the channel
  // and then sends
  for (aliceFanMail <- alice) {
    aliceFanMail!("Dear Alice, you're #TheBest")
  }
  |

  // Eve tries to intercept a message, but cannot
  // because Alice's fanmail channel is write-only
  for (aliceFanMail <- alice) {
    for (@stolenMail <= aliceFanMail) {
      stdout!(["Eve stole a message: ", stolenMail])
    }
  }
}
```

`bundle+ {*aliceFanMail}`是一个与`aliceFanMail`类似的频道，只是它只能被发送消息，而不能接收。

#### Subscriptions

上面的捆绑解决方案确实防止了Eve窃取邮件，这很好。但在区块链背景下，它也有一个不幸的副作用，即Alice必须付费才能发送她的粉丝邮件地址。区块链费用的作用有点像邮费。

Alice可以通过让粉丝向她索取粉丝邮件地址来节省邮费，然后他们将不得不支付交易成本，有点像寄一个已经盖了邮票的回信信封。

```c++
new alice, bob, eve, stdout(`rho:io:stdout`) in {

  // Alice get a lot of fan mail, so she
  // creates a new write only bundle and publishes it.
  new aliceFanMail in {

    // Alice returns fanmail channel to any fan that asks
    for (return <= alice) {
      return!(bundle+ {*aliceFanMail})
    }
    |

    // Alice also reads fan mail
    for (mail <- aliceFanMail) {
      stdout!("Alice received a fanmail")
    }
  }
  |

  // When Bob wants to send fanmail he asks for the channel
  // and then sends
  new return in {
    alice!(*return) |
    for (aliceFanMail <- return) {
      aliceFanMail!("Dear Alice, you're #TheBest")
    }
  }
  |

  // Eve tries to intercept a message, but cannot
  // because Alice's channel is write-only
  new return in {
    alice!(*return) |
    for (aliceFanMail <- return) {
      for (@stolenMail <= aliceFanMail) {
        stdout!(["Eve stole a message: ", stolenMail])
      }
    }
  }
}
```

#### Jackpot

如何将一条信息发送给多个人？我们在这里需要用到Peek的技巧。

```c++
new throw, stdout(`rho:io:stdout`) in {
  // Throw the ball worth five points
  throw!(5)
  |

  // Throw the ball several more times
  throw!(4) |
  throw!(2) |
  throw!(6) |

  // Bill and Paige both try to catch
  for (points <= throw){
    stdout!("Bill caught it")
  }
  |
  for (points <= throw){
    stdout!("Paige caught it")
  }
}
```

在这个例子中，`throw`是一个可以发送和接收的通道，它用来传递一些分数值。Bill和Paige都试图从`throw`上接收分数，并打印出相应的信息。但是，由于Rholang是一种并发语言，所以`throw`上的分数值可能会被两个人同时接收，也可能只被其中一个人接收。这取决于他们的执行顺序和竞争情况。为了避免这种不确定性，我们可以使用`bundle+`操作符将`throw`转换为一个只能发送不能接收的通道，然后将它公开给Bill和Paige。这样，他们就不能直接从`throw`上接收分数，而只能通过另一个通道来请求分数。这样就可以保证每个分数值只被一个人接收，并且可以控制分数的分配规则。例如，我们可以让第一个请求者得到最高的分数，或者随机地分配分数。

```c++
new throw, stdout(`rho:io:stdout`), stdoutAck(`rho:io:stdoutAck`) in {
  // Throw the ball worth five points
  throw!(5)
  |

  // Throw the ball several more times
  throw!(4) |
  throw!(2) |
  throw!(6) |

  // Bill and Paige both try to catch
  // But they cannot receive directly from throw
  // They have to request the score from a bundled channel
  for (bundledThrow <= bundle+{*throw}) {
    for (request <= bundledThrow) {
      for (points <- throw) {
        request!(points)
      }
    }
  }
  |

  // Bill requests the score from the bundled channel
  new billRequest in {
    for (bundledThrow <- throw) {
      bundledThrow!(billRequest)
      |
      for (points <- billRequest) {
        // Use stdoutAck to print the score and wait for the ack signal
        new ack in {
          stdoutAck!((points, *ack))
          |
          for (_ <- ack) {
            stdout!("Bill caught it")
          }
        }
      }
    }
  }
  |

  // Paige requests the score from the bundled channel
  new paigeRequest in {
    for (bundledThrow <- throw) {
      bundledThrow!(paigeRequest)
      |
      for (points <- paigeRequest) {
        // Use stdoutAck to print the score and wait for the ack signal
        new ack in {
          stdoutAck!((points, *ack))
          |
          for (_ <- ack) {
            stdout!("Paige caught it")
          }
        }
      }
    }
  }
}

```

### Side Bar: String Operations
大多数编程语言都允许将两个字符串连接在一起，rholang也不例外。我们可以`stdout！("Hello"++"world")`，但我们不能将字符串与int连接。

一种解决方案是使用stdoutAck和发送ack 。另一个选项是打印列表`stdout!(["Bill caught it. Points earned: ", *points])`。

最后一个选项是使用字符串插值。字符串插值允许我们将占位符放入字符串中，并使用映射将其替换为实际值。

```c++
new stdout(`rho:io:stdout`) in {

  printStuff!({"noun": person, "adverb": sideways}) |
  
  contract printStuff(map) = {
    stdout!("The ${noun} jumped ${adverb}" %% *map)
  }
}
```

#### Imposter throws

实际上，在上面的扔球实验中，我们可以发现任何人都可以加入并扔一个假球来捣乱，这与Eve偷取邮件例子是相反的。

所以在这里我们采用只读模式来转换`throw`信道，从而使其他人不能向其中写入。

```c++
new gameCh, stdout(`rho:io:stdout`) in {
  new throw in {

    //Give out read-only access
    gameCh!!(bundle- {*throw})
    |
    // Now actually make all the throws
    throw!(4) |
    throw!(2) |
    throw!(6)
  }
  |
  // Bill and Paige join the game
  for (throw <- gameCh){
    for (points <= throw){
      stdout!(["Bill caught it. Points: ", *points])
    }
  }
  |
  // Eve tries to throw a fake, but can't
  for (throw <- gameCh){
    throw!(100)
  }
}
```

### Public Key Crypto

在某些方面，只读捆绑包复制了公钥加密的签名功能。这里的中奖者确信球来自投掷者，因为只有他才能在投掷通道上发送，这很像加密签名。
而在某些方面，只写捆绑包复制了公钥加密的加密功能。只有Alice才能接收粉丝邮件频道发送的信息。一个非常重要的区别是，在这里发送的消息在区块链之外是100%可见的！因此，虽然只写捆绑包是交流不可伪造姓名的有效方式，但它们不是策划抢劫或逃避政府监控的好方法。

### More About Bundles

|Syntax	|Can Read	|Can Write
|---|---|---|
`bundle- {proc}`	|YES	|NO
`bundle+ {proc}`	|NO	|YES
`bundle0 {proc}`	|NO	|NO
`bundle {proc}`	|YES	|YES

## State Channels

### Holding on to data

Rholang另一个特殊的点在于它没有传统的变量，而是仅仅使用元组空间来存储数据。每当需要临时存储某些数据，只需要将它发送到某个信道然后在需要使用的使用接收它就好了。而这样的信道我们就称为"state channels"，并且常在它们的名称后加"Ch"。

```c++
new stdout(`rho:io:stdout`), boxCh in {
  // To save data we just put it in the box
  boxCh!(42)
  |

  // Then to get data back out
  for (data <- boxCh) {
    // Do whatever you want with the data here.
    stdout!(*data)
  }
}
```

#### Persisting Data

当我们再次检查上面代码中的 `boxCh`， 我们并不会得到一个结果，因为一旦我们接收了该消息，那么该消息就会从对应的元组空间中被使用掉。而为了持续使用数据，我们一般将一个copy传送回信道。

### Patience Game Revisited

在这里，我们用"state channel"的方式来解决我们之前提到的Patience Game。

```c++
new P1, P2, stdout(`rho:io:stdout`) in {

  // active gets its own scope so players can't change its value.
  new active in {
    active!(true)
    |
    for(_ <- active; _ <- P1) {
      for( _ <- P2) {
        stdout!("P2 Wins")
      }
    }
    |
    for(_ <- active; _ <- P2) {
      for (_ <- P1) {
        stdout!("P1 Wins")
      }
    }
  }
  |
  P1!(Nil)
  |
  P2!(Nil)
}
```

在上面的代码中我们可以发现，在第一次调用`active`后，该`activeCh`变为空，也就能避免每个代码块都被调用一次。

### Objects and Methods

在java等“面向对象编程”语言中，我们可以通过封装一些数据以及使用或更改数据的方法来对真实世界的对象进行建模。同样的事情在Rholang也是可能的。

在下面的例子中，创建了一个基本点击计数器对象：

```c++
new currentCount, increase, reset, check, stdout(`rho:io:stdout`) in {
  
  // Starting the counter at 0
  currentCount!(0) |

  // Method to increase counter (returns the old value)
  contract increase(ack) = {
    for(old <- currentCount) {
      currentCount!(*old + 1) |
      ack!(*old)
    }
  } |

  // Method to reset the counter (returns the old value)
  contract reset(ack) = {
    for(old <- currentCount) {
      currentCount!(0) |
      ack!(*old)
    }

  } |

  // Increase the value three times
  new ack in {
    increase!(*ack) |
    for(_ <- ack) {
      increase!(*ack) |
      for(_ <- ack) {
        increase!(*ack) |
        for(_ <- ack) {
          increase!(*ack) |

          // And check it's value afterwards
          for(_ <- ack; count <- currentCount) {
            stdout!(*count)
          }
        } 
      }
    }
  }
}
```

#### Factories

如果你已经用java等其他语言编程，你可能熟悉构造函数。而Rholang使用工厂来生成新对象，而不是构造函数。

计数器在rholang中是一个有用的构造，您可能会发现您在项目中使用了它。问题是，许多项目可能想要使用计数器，而只有一个计数器是不够的。因此，解决方案是签订一份制造柜台的工厂合同。当工厂合同被调用时，它会发回一个全新的计数器。也就是说，Rholang中也可以用到设计模式中的工厂模式。

```c++
new counterFactory, stdout(`rho:io:stdout`) in {
  contract counterFactory(increase, reset) = {
    new currentCount in {
      // Start the counter at zero
      currentCount!(0) |

      // Method to increase counter (returns the old value)
      contract increase(ack) = {
        for (old <- currentCount) {
          currentCount!(*old + 1) |
          ack!(*old)
        }
      }
      |

      // Method to reset the counter (returns the old value)
      contract reset(ack) = {
        for(old <- currentCount){
          currentCount!(0) |
          ack!(*old)
        }
      }
    }
  }
  |

  new ack, myIncrease, myReset in {
    // Demo using the counter here
    Nil
  }
}
```

用户可以通过`counterFactory!(myIncrease, myReset)`来调用工厂获取一个新的计数器，他也可以通过`myReset!(*ack)`来重置上述创建的计数器。

### Method Dispatching

有两种主要技术可以使方法可用。第一个选项称之为“separation of powers”，因为每个方法都在自己的专用通道上侦听。另一种选择是“control panel”技术，其中有一个不可伪造的名称，称为控制面板，所有方法都建立在它之上。

```c++
// Separation of Powers
contract factory(method1, method2) = {
  contract method1(ack) = { ... }
  contract method2(ack) = { ... }
}

// Control Panel
contract factory(cPanel) = {
  contract @[cPanel, "method1"](ack) = { ... }
  contract @[cPanel, "method2"](ack) = { ... }
}
```

而上述计数器代码就使用了"Separation of Powers"来匹配模式。

## Object Capabilities

在本节，会学习放置在不可伪造名称上的方法如何产生一种非常有用的设计模式，称为“Object Capabilities”。

这种设计模式的一个非常常见的例子是汽车/房子的钥匙。处理这种对象让我们能够拥有进入房子/汽车的能力，而我们也能将这种对象传递/复制给其他人来让他们也拥有这种能力。

### ATC Revisited

接下来，将会重写此前碰到的空中交通控制例子。之前我们只能够传递信息，但是我们并不能更新我们的信息，所以接下来的代码将会完善这个功能。

```c++
new stationFactory, stdout(`rho:io:stdout`) in {
  contract stationFactory(initialMessage, getInfo, setInfo) = {
    new currentMessage in {
      // Populate the initial message
      currentMessage!(*initialMessage)
      |

      // Owner can update the message anytime
      contract setInfo(newMessage) = {
        for (msg <- currentMessage) {
          currentMessage!(*newMessage)
        }
      }
      |

      // User tunes in for latest message
      contract getInfo(return) = {
        for (msg <- currentMessage){
          return!(*msg)
          |
          currentMessage!(*msg)
        }
      }
    }
  }
  |

  // Controllers create new station with private set capability
  // and public get capability
  new airportInfo, set in {
    stationFactory!("Weather is nice", *airportInfo, *set)
  }
  |
  // Listener tunes in to receive latest message
  airportInfo!(*stdout)
}
```

使用只读bundle似乎很自然。但是，如果我们使用bundle，那么接收消息的第一个飞行员将从状态通道使用它。它不会留给其他飞行员接收。为了确保消息像我们想要的那样持久化，我们自己处理对状态信道的所有访问，并且只给飞行员查询正确消息的能力。

而在上述例子中，如果我们需要更新信息，只需要调用`set!("Strong crosswinds, be advised")`即可。

### Savings Account

在接下来的例子中，我们将会实现一个存储账户的例子，然后它将会有存钱、取钱以及查询余额的方法。而与计数器不同，一个账户是需要保证安全的，我们不希望任何人都能知道我们的余额，或者甚至从里面取钱。

```c++
new openAccount in {
  // This contract registers a new account and creates its methods.
  contract openAccount(initialDeposit, deposit, withdraw, check) = {
    new balanceCh in {
      balanceCh!(*initialDeposit)
      |

      // Withdraw Contract
      contract withdraw(amount, ack) = {
        for (old <- balanceCh) {
          balanceCh!(*old - *amount) |
          ack!(Nil)
        }
      }

      // Deposit Contract

      // Check contract
    }
  }
  |

  // Customer Sarah creates an uses an account
  new sarahDeposit, sarahWithdraw, sarahCheck, ack in {
    openAccount!(10, *sarahDeposit, *sarahWithdraw, *sarahCheck) |
    sarahWithdraw!(3, *ack) |
    for (_ <- ack) {
      Nil// TODO check balance here
    }
  }
}
```

在上面的代码中，`openAccount`合约实际上是一个工厂。

#### Stealing Funds

我们并不能想出任何其他人能够偷取Sarah的资金的方法，这是因为只有Sarah能够使用控制账户的unforgeable names。

而如果Sarah希望允许他的朋友Stephanie来向他的银行账户存钱但是不能查询/取钱，那么他需要将存钱对应的name传入朋友的命名空间。
也就是调用`stephanie!(*sarahDeposit)`。

### Two Kinds of Factories

到目前为止，我们所有的工厂方法都要求我们输入构建合同的名称。在储蓄账户的例子中，这些名字分别是`check`、`deposit`和`withdraw`。我们可以称之为“BYOC”或“bring your own channel”工厂。BYOC技术的优点是，用户可以提供她喜欢的任何名称，包括她从其他合同或公共名称中获得的名称。

而另一种方式是允许工厂自行创建名称，并且将它传递回调用者。我们可以称之为"full service"工厂。如果我们对传入抽象名称的需求不高，我们完全可以使用这种全职工厂来减少麻烦。

#### Abortable Rocket Launch

当我们第一次学习联接运算符时，我们考虑了一种情况，即两个运算符都必须获得发射火箭的许可。现在我们希望他们也能够收回许可。而解决的方法就是在它们给出发射命令时给运算符一个终止按钮。

```c++
new rocketFactory in {

  // When a new rocket is setup, a launch capability for each for each operator is passed in
  contract rocketFactory(aliceLaunch, bobLaunch, ack) = {
    new aliceReadyCh, bobReadyCh in {
      // Start out neither ready
      aliceReadyCh!(false)|
      bobReadyCh!(false)|

      contract aliceLaunch(ack) = {
        new aliceAbort in {
          for (_ <- aliceReadyCh) {
            aliceReadyCh!(true)
          }
          |
          contract aliceAbort(ack) = {
            for(_ <- aliceReadyCh) {
              aliceReadyCh!(false)
              |
              ack!(Nil)
            }
          }
          |
          ack!(*aliceAbort)
        }
      }
      |
      Nil // Bob contract goes here
      | ack!(Nil)
    }
  }
  |
  // Make a new rocket to test
  new aliceLaunch, bobLaunch, ack in {
    rocketFactory!(*aliceLaunch, *bobLaunch, *ack)|
    for (_ <- ack){
      Nil // Tests go here
    }
  }
}
```

## Additional Syntax

在本节，将会学习一些非常有用的表达式以便于我们能够实现一些常用的工具。

### Binary Operators

第一个需要学习的是二元操作符。

```c++
new c2f, f2c in {

  /**
   * Converts Celcius temperatures to Farenheit. The conversion
   * multiply by 9/5 and add 32
   */
  contract c2f(celcius, return) = {
    return!((*celcius * 9 / 5) + 32)
  }
  |

  contract f2c(farenheit, return) = {
    Nil // TODO you complete this contract
  }
  |

  new stdout(`rho:io:stdout`) in {
    // 0 C should be 32 F
    c2f!(0, *stdout)
    |
    // 100 C should be 212 F
    c2f!(100, *stdout)
  }
}
```

最后一个需要知道的二元运算符是`++`，被用于关联/联接。这个操作符一般用于列表/字符串等。

```c++
new greeter in {
  contract greeter(name, return) = {
    return!("Hello there, " ++ *name)
  }
  |
  new stdout(`rho:io:stdout`) in {
    greeter!("Joshy", *stdout)|
    greeter!("Tom", *stdout)
  }
}
```

### Receiving Processes?

**我们总是发送process并且接收name！！！**

我们可以通过`@`运算符来将process转换为name，从而使它可以被接收，借助这个运算符我们可以完成如下工作：`for (@number <- someChan){double!(2 * number)}`。

需要注意的是！虽然采用了 `@` 运算符，被修饰的process仍然是process，而 `@***`才是一个name。

### Ifs and Conditions

类似于其他语言，Rholang中也有条件判断语句。

```c++
if ( /* condition */ ) {
  Nil // Do this if condition is true
}
else {
  Nil // Do this if condition is false
}
```

接下来一个例子展示了可以如何检查一个银行账户的状态：

```c++
new stdout(`rho:io:stdout`) in {
  for (@balance <= @"signTest") {
    if (balance > 0) {
      stdout!("Account in good standing.")
    } else {
      stdout!("Account overdrawn.")
    }
  }
}
|
@"signTest"!(5)
```

在上述例子中，我们也可以用`>=`来修正账户余额为0时账户透支的Bug。

### Comparison Operators | Boolean Operators

如下为一些比较运算符，值得注意的是，它们都可以用于数字或是文本字符串，不过文本字符串会按字典顺序排序，但是如果将文本与数字进行比较，那么进程将会终止：

```c++
a > b //Is a greater than b?
a < b //Is a less than b?
a == b //Is a equal to b?
a <= b //Is a less than or equal to b?
a >= b //Is a greater than or equal to b?
a != b //Is a unequal to b?
```

Rholang也有一些经典的布尔运算符例如AND,OR,NOT，运算的结果为true/false。

```c++
a and b
a or b
not a
```

## Pattern Matching

模式在生活中随处可见，如果我们发现一款此前从未见过的新款汽车，我们仍然知道它是一辆汽车。这是因为它满足四个轮子、两个/四个门、一个挡风玻璃这样的模式。

### About Patterns

Rholang允许程序员使用模式匹配来控制程序的执行。也就是说，不同的代码可以运行，这取决于进程是否匹配特定的模式。

### The `match` construct

Rholang中最常见的使用模式匹配的地方就是`match`。

```c++
new patternMatcher, stdout(`rho:io:stdout`) in {

  for (x <= patternMatcher) {
   match *x {
    Nil       => stdout!("Got the stopped process")
    "hello"   => stdout!("Got the string hello")
    [x, y]    => stdout!("Got a two-element list")
    Int       => stdout!("Got an integer")
    _         => stdout!("Got something else")
   }
  }
  |

  // Make sure the pattern matcher works
  patternMatcher!({for(@0 <- @0){0}})
  |
  patternMatcher!({@"world"!("hello")})
  |
  patternMatcher!({0|"hello"})
  |
  patternMatcher!(Nil)
}
```

在上面的例子中，任何被`patternMatcher`信道接收的信息`x`都表示一个被引用的过程(process)。下划线只是填补空白，完全匹配任何模式。它被称为“通配符”，我们通常会将其视为匹配结构中的最终模式，以确保在没有其他匹配的情况下存在默认情况。

模式匹配也可以用于`for`或是`contract`。

#### Two cases we've seen

在之前小节的例子中我们已经使用过下划线作为通配符了，例如`for (_ <- ack)`，这意味着我们只关心我们收到了一个消息，而不关心消息内容是什么。

我们也在之前小节中使用模式匹配来接收process。当我们写`for (@p <- x)`，它意味着接收任何匹配quoted process模式的信息，并且将该过程(process)与`p`绑定。

#### Syntactic sugar

我们可以发现，`match`完全可以替代之前学的`if/else`。而实际上，`if/else`就是一种语法糖，以下两种代码是等效的：

```c++
if (cond) {
  // Do Process P
}
else {
  // Do Process Q
}

//or 

match cond {
  true => // Do Process P
  false => // Do Process Q
}
```

#### A Nicer Greeter

以下是一个用到`++`运算符的例子，而在这个例子中的关键是，我们有两种不同的合约，但是它们在同一个信道`greeter`信道上监听：

```c++
new greeter in {
  contract greeter(name, return) = {
    return!("Hello there, " ++ *name)
  }
  |
  // Default case where there is no name
  contract greeter(return) = {
    return!("Hello there, world")
  }
  |
  new stdout(`rho:io:stdout`) in {
    greeter!("Joshy", *stdout)|
    greeter!("Tom", *stdout)
  }
}
```

Rholang判断执行上述哪一个的关键是Rholang会执行满足我们传入参数的合约。

#### Advanced pattern matching

我们可以用模式匹配做一些其他的事情，比如 `for(@{x!(P)} <- y){ Q }`， 只有当在通道x上发送的进程与单个发送的模式匹配时，它才会减少。然后在过程(process)Q中，我们将绑定变量x、通道和P，即正在发送的过程(process)。

```c++
new patternMatcher, stdout(`rho:io:stdout`) in {

  for (x <= patternMatcher) {
   match *x {
    Nil               => stdout!("Got the stopped process")
    {_!(_)}           => stdout!("Got a send")
    {for(@0 <- _){_}} => stdout!("Got a receive on @0")
    _                 => stdout!("Got something else")
   }
  }
  |

  // Make sure the pattern matcher works
  patternMatcher!({for(@0 <- @0){0}})
  |
  patternMatcher!({@"world"!("hello")})
  |
  patternMatcher!({0|"hello"})
  |
  patternMatcher!(Nil)
}
```

### Unions and Intersections

如果我们希望去匹配两个模式/或是两个都不匹配，那么我们需要用到并集与交集运算符。

要匹配几种模式中的任何一种，需要使用“并集”运算符`\/`，

```c++
new log(`rho:io:stdout`), binderChecker in {
  contract binderChecker(@data, return) = {
    match data {
      "nombre" \/ "name" => return!("name-like")
      _ => return!("not name-like")
    }
  }
  |
  binderChecker!("name", *log)
  |
  binderChecker!("nombre", *log)
}
```

要同时匹配两种模式，需要使用“交集”运算符`/\`。在本例中，我们正在验证注册数据是否有效。注册人必须提供他们的姓名和年龄，并可以提供任何数量的额外数据。顺便说一下，这种存储键值数据的技术通常被称为“RHOCore”。

```c++
new print(`rho:io:stdout`), register in {

  for (@{{@"name"!(_) | _} /\ {@"age"!(_) | _}} <= register){
    print!("Both name and age were in the data")
  }
  |

  register!(@"name"!(Nil))
  |
  register!(@"age"!(Nil))
  |
  register!(@"name"!(Nil) | @"age"!(Nil))
  |
  register!(@"name"!(Nil) | @"age"!(Nil) | @"height"!(175))
}
```

### More About Bundles

此前我们讨论了bundles如何被用于创建只读/只写信道，但是我们仍然没有讨论他们的同名特性。bundle可以用来“捆绑”复合名称，这样它们就不会被模式匹配拆散。

在下面这个示例代码中，军队有一枚导弹，他们通过在unforgeable name上建立capability来保持对导弹发射的控制。由于外交关系，军队将允许公众检查导弹的安全性，但肯定不会发射。

```c++
new log(`rho:io:stdout`), missile in {
  contract @(*missile, "launch")(_) = {
    log!("launching...")
  }
  |
  contract @(*missile, "inspect")(_) = {
    log!("inspecting...")
  }
  |

  contract @"getInspectionChannel"(return) = {
    return!((*missile, "inspect"))
  }
}
```

但是对于这个军队而言，他们有一个致命的错误！任何人都能启动他们的导弹！

```c++
new getInspectionChannel, ack in {
  getInspectionChannel!(*ack)|
  for(@(missile, "inspect") <- ack){
    @(missile, "launch")!(Nil)
  }
}
```

而为了解决这个问题，军队给出了一个捆绑版本的复合名称，所以它不能再被模式匹配所分解。

```c++
new getInspectionChannel, log(`rho:io:stdout`), missile in {
  contract @(*missile, "launch")(_) = {
    log!("launching...")
  }
  |
  contract @(*missile, "inspect")(_) = {
    log!("inspecting...")
  }
  |

  contract getInspectionChannel(return) = {
    return!(bundle+{(*missile, "inspect")})
  }
}
```

## Data Structures

程序处理和存储真实世界的数据是很常见的。每当你有很多数据时，重要的是要把它整理好，这样你就可以快速找到你需要的信息。在模拟世界中，纸质文件通过堆叠、放在文件夹和文件柜中来保持组织。同样的概念也适用于编程，rholang也不例外，rholang也有自己的数据结构！

### String Methods

与其他数据结构一样，字符串拥有执行操作的方法。

字符串的`length`方法告诉我们字符串中有多少字符，`slice`方法创建一个原字符串切割后的新字符串。同时，字符串也支持`++`运算符用于连接字符串。

```c++
new wordLength, stdout(`rho:io:stdout`) in {
  contract wordLength(@word) = {
    stdout!("How many characters in " ++ word)|
    stdout!(word.length())|
    stdout!("Shorter version: " ++ word.slice(0, 5))
  }
  |
  wordLength!("Cantaloupe")
}
```

字符串还有一个名为`hexToBytes`的方法，用于处理包含有效十六进制数的字符串。它返回一个由该十六进制数表示的字节数组。切割字符数组也是可以的。

### Tuples

元组中的项数称为arity。元组按顺序包含多条数据。它们总是固定的arity，并且方法相对较少。因此，它们是最不有趣的数据结构，但同时也是最基本的。

```c++
new tCh, print(`rho:io:stdout`) in {

  tCh!!((3, 4, 5))|

  // Test nth
  for (@t <- tCh){
    print!(["Test nth. Expected: 5. Got ", t.nth(2)])
  }
  |

  // Test toByteArray
  for (@t <- tCh){
    print!(["toByteArray test. Got: ", t.toByteArray()])
  }
}
```

### Lists

列表与元组很像，但是列表是由方括号建立的，它们有更多的方法。

```c++
new lCh, stdout(`rho:io:stdout`) in {

  // Make a new list, l
  lCh!!([3, 4, 5])|

  // Test nth
  for (@l <- lCh){
    stdout!("Test nth. Expected: 5. Got: ${ans}" %% {"ans": l.nth(2)})
  }
  |

  // Test toByteArray
  for (@l <- lCh){
    stdout!(["Test toByteArray. Got: ", l.toByteArray()])
  }
  |

  // Test slice
  for (@l <- lCh){
    stdout!(["Test slice. Expected: [4, 5]. Got: ", l.slice(1, 3)])
  }
  |

  // Test length
  for (@l <- lCh){
    stdout!("Test length. Expected: 3. Got: '${ans}" %% {"ans": l.length()})
  }
}
```

而在下面这个例子中，用户每次跑步经过他们跑步的距离时都会调用合同。合同将在一个列表中记录所有跑步情况。我们还可以编写方法来获取所有跑步数据，或者获取用户跑步的总距离。

```c++
new logRun, runsCh, totalDistanceCh in {
  // Initialize an empty list for runs
  runsCh!([]) |

  // Initialize a channel for total distance
  totalDistanceCh!(0) |

  contract logRun(distance) = {
    // Get the current list of runs
    for (@runs <- runsCh) {
      // Append the new distance to the list
      new updatedRuns in {
        updatedRuns!([distance] ++ runs) |
        // Update the stored list of runs
        runsCh!(updatedRuns) |

        // Calculate and update total distance
        for (@totalDistance <- totalDistanceCh) {
          new updatedTotalDistance in {
            updatedTotalDistance!(totalDistance + distance) |
            totalDistanceCh!(updatedTotalDistance)
          }
        }
      }
    }
  }

  // Contract to get the total distance
  contract getTotalDistance(ret) = {
    for (@totalDistance <- totalDistanceCh) {
      ret!(*totalDistance)
    }
  }
}

```

### Sets

集合在某些方面与列表相似，但最大的区别是集合没有排序。集合是进程的集合，但集合中没有第一项或最后一项。集合中也不允许重复。

```c++
new sCh, stdout(`rho:io:stdout`) in {

  sCh!!(Set(3, 4, 5))|

  // Test toByteArray
  for (@s <- sCh){
    stdout!(["Test toByteArray. Got: ", s.toByteArray()])
  }
  |

  // Test Add
  for (@s <- sCh){
    stdout!(["Test add. Expected Set(3, 4, 5, 6), Got: ", s.add(6)])
  }
  |

  // Test Diff
  for (@s <- sCh){
    stdout!(["Test diff. Expected: Set(5) Got: ", s.diff(Set(3, 4))])
  }
  |

  // Test Union
  for (@s <- sCh){
    stdout!(["Test union. Expected: Set(1, 2, 3, 4, 5). Got: ", s.union(Set(1, 2))])
  }
  |

  // Test Delete
  for (@s <- sCh){
    stdout!(["Test delete. Expected: Set(3, 4). Got: ", s.delete(5)])
  }
  |

  // Test Contains
  for (@s <- sCh){
    stdout!(["Test contains. Expected: true. Got:", s.contains(5)])|
    stdout!(["Test contains. Expected: false. Got: ", s.contains(6)])
  }
  |

  // Test Size
  for (@s <- sCh){
    stdout!("Test size. Expected 3. Got: ${ans}" %% {"ans": s.size()})
  }
}
```

### Maps

图与集合很像，但是它们包含键值对。图也是无序的。

```c++
new mCh, print(`rho:io:stdout`) in {

  mCh!!({"a": 3, "b": 4, "c": 5})|

  // Test toByteArray
  for (@m <- mCh){
    print!(["Test toByteArray. Got: ", m.toByteArray()])
  }
  |

  // Test Union
  for (@m <- mCh){
    print!(["Test union. Expected: {a: 3, b: 4, c: 5, d: 6}. Got: ", m.union({"d": 6})])
  }
  |

  // Test Diff
  for (@m <- mCh){
    print!(["Test diff. Expected: {b: 4, c: 5}. Got: ", m.diff({"a": 3})])
  }
  |

  // Test Delete
  for (@m <- mCh){
    print!(["Test delete. Expected: {a: 3, b: 4}. Got: ", m.delete("c")])
  }
  |

  // Test Contains
  for (@m <- mCh){
    print!(["Test contains. Expected: true. Got: ", m.contains("c")])|
    print!(["Test contains. Expected: false. Got: ", m.contains("d")])
  }
  |

  // Test Get
  for (@m <- mCh){
    print!(["Test get. Expected: 4. Got: ", m.get("b")])
  }
  |

  // Test GetOrElse
  for (@m <- mCh){
    print!(["getOrElseSuccessful. Expected: 4. Got: ", m.getOrElse("b", "?")])|
    print!(["getOrElseFailed. Expected: ?. Got: ", m.getOrElse("d", "?")])
  }
  |

  // Test Set
  for (@m <- mCh){
    print!(["Test set. Expected {a: 3, b: 2, c: 5}. Got: ", m.set("b", 2)])
  }
  |

  // Test Keys
  for (@m <- mCh){
    print!(["Test keys. Expected Set(a, b, c)). Got: ", m.keys()])
  }
  |

  // Test Size
  for (@m <- mCh){
    print!(["Test size. Expected 3. Got: ", m.size()])
  }
}
```

为了证明地图在rholang中的有用性，让我们考虑一下这个合同，它可以查找任何国家的首都。

```c++
new capitalOf, print(`rho:io:stdout`) in {
  new mapCh in {

    // Use a persistent send instead of peeking later
    mapCh!!({"Canada": "Ottawa",
             "Nigeria": "Abuja",
             "Germany": "Berlin",
             "Antarctica": Nil,
             "China": "Beijing",
             "Ecuador": "Quito",
             "Australia": "Canberra"})
    |
    contract capitalOf(@country, return) = {
      for (@map <- mapCh) {
        return!(map.getOrElse(country, "I don't know"))
      }
    }
  }
  |
  new answerCh in {
    capitalOf!("Canada", *answerCh)|
    for (@cap <- answerCh) {
      print!("Capital of ${cntry} is ${cap}." %% {"cntry": "Canada", "cap": cap})
    }
  }
}
```

从上面的示例代码开始，以下是一个“国家和首都”智力竞赛游戏的示例，用户调用一份合同，并返回一个挑战国家和一个回答频道。然后，用户通过回答通道发回她对该国首都的最佳猜测，并返回一个布尔值，以确定她是否正确。

```c++
new capitalOf, print(`rho:io:stdout`) in {
  new mapCh in {
    // Initialize the map of countries and capitals
    mapCh!!({"Canada": "Ottawa",
             "Nigeria": "Abuja",
             "Germany": "Berlin",
             "Antarctica": Nil,
             "China": "Beijing",
             "Ecuador": "Quito",
             "Australia": "Canberra"})

    // Contract to get a random country challenge
    contract getRandomCountry(return) = {
      for (@map <- mapCh) {
        // Get a random country from the map
        new countries in {
          countries!(map.keys()) |
          for (@country <- countries) {
            return!(country)
          }
        }
      }
    }

    // Contract to check if the user's guess is correct
    contract checkGuess(@country, @guess, return) = {
      for (@map <- mapCh) {
        match map.get(country) {
          Some(capital) => return!(guess == capital)
          None => return!(false)
        }
      }
    }
  } |

  new answerCh in {
    // Get a random country challenge
    getRandomCountry!(*answerCh) |
    for (@challengeCountry <- answerCh) {
      // User sends their guess for the capital
      new userGuess in {
        userGuess!("Canada", *answerCh) |
        for (@guess <- answerCh) {
          // Check if the guess is correct
          checkGuess!(challengeCountry, guess, *answerCh) |
          for (@correct <- answerCh) {
            print!("Is ${cntry}'s capital ${cap}? Answer: ${correct}" %% {"cntry": challengeCountry, "cap": guess})
          }
        }
      }
    }
  }
}

```

### Sending and Receiving on Compound Names

在本节中，我们了解了几个有趣的数据结构。数据结构是像整数、布尔值和零一样的过程(process)。因此，它们可以像所有其他过程(process)一样被引用并转化为名称。我们可以用这些名字建立合同，就像我们可以用任何其他名字一样。建立在元组等数据结构上的名称通常称为复合名称。

在这个例子中，Alice和Bob各有一个不可伪造的名字（我称之为key）。键本身可能很有用（对于代码片段中未显示的内容），但只有当它们一起使用时，才能调用显示的contract。这被称为“权利放大”。

```c++
new alice, bob, key1, key2, stdout(`rho:io:stdout`) in {

  alice!(*key1)|
  bob!(*key2)|

  contract @(*key1, *key2)(_) = {
    stdout!("Congratulations, Alice and Bob, you've cooperated.")
  }
}
```

## Recursion

许多编程语言使用迭代作为控制程序流的基本方式。迭代本质上意味着对一个项目进行一个过程，然后对下一个项目再进行下一个。因为rholang是一种完全并发的编程语言，所以这是不可能的。

这里官方文档be了🤣

### Iteration

```c++
new iterate in {
    contract iterate(@list, process, done) = {
      match list {
        [hd, ...tl] => {
          new ack in {
            process!(hd, *ack) |
            for (_ <- ack) { iterate!(tl, *process, *done) }
          }
        }
        _ => done!(Nil)
      }
    } |
    new process, done in {
      iterate!([4,5,6], *process, *done) |
      contract process(@item, ack) = {
        /* handle processing of item */
        ack!(Nil)
      } |
      for (_ <- done) {
        /* done! */
        Nil
      }
    }
  }
```

## Games

这里也be了🤷‍♀️

## Off Chain

到目前为止，我们所有的练习都完全存在于rholang的世界里。虽然rholang是一种通用编程语言，但它目前的作用是作为一种区块链语言。许多精彩的智能合约正在用rholang编写。当他们在做那些真实世界的事情时，他们需要一个地方来存储他们不可伪造的名字。因为不可伪造的名字只能存在于区块链上。

### Name Registry

Name Registry为该问题提供了部分解决方案。要注册名称，请遵循以下示例。

```c++
new doubler,
  uriChan,
  insertArbitrary(`rho:registry:insertArbitrary`),
  stdout(`rho:io:stdout`) in {

   // This is a silly contract that we'll register
  contract doubler(@n /\ Int, return) = {
    return!(2 * n)
  } |

  // Tell the registry that we want to register
  // give URI back on uriChan
  insertArbitrary!(bundle+{*doubler}  , *uriChan) |
 
  // Wait for URI response
  for(@uri <- uriChan) {
    stdout!(uri)
  }
}
```

而如果要查找名称以便以后使用

```c++
new doublerCh,
  lookup(`rho:registry:lookup`),
  stdout(`rho:io:stdout`) in {
  
  // Ask the registry to lookup the URI and send the contract back on doublerCh
  lookup!(`rho:id:fos1m8yaki3s8g1ytzkr6boucnhab6nafoco8ww63xqj5k8aa1xfza`, *doublerCh) |

  // Wait to receive the answer back from the registry
  for( doubler <- doublerCh) {
    
    // Double a number and send the answer to stdout
    doubler!(7, *stdout)
  }
}
```

具体细节无从得知，因为作者认为现在的Rholang还很有安全风险，他没摆出来。

## Examples

### 

```javascript
// @ts-check

// TODO: rholang goes in .rho files

// TODO: expression macros, blockly UX
/** @type { FieldSpec } */
const KudosReg = {
  type: 'uri',
  value: 'rho:id:eifmzammsbx8gg5fjghjn34pw6hbi6hqep7gyk4bei96nmra11m4hi',
};

/** @type { FieldSpec } */
const rollReg = {
  type: 'uri',
  // AGM2020 voter list on mainnet
  // value: 'rho:id:admzpibb3gxxp18idri7h6eneg4io6myfmcmjhufc6asy73bgrojop',
  // testnet
  value: 'rho:id:kiijxigqydnt7ds3w6w3ijdszswfysr3hpspthuyxz4yn3ksn4ckzf',
};

/**
 * @typedef {{ template: string, fields?: Record<string, FieldSpec> }} ActionSpec
 * @typedef {{ type: 'string' | 'uri' | 'walletRevAddr', value?: string }} FieldSpec
 * @type {Record<string, ActionSpec>}
 */
export const actions = {
  newMemberDirectory: {
    fields: {
      contractURI: {
        // testnet
        value: 'rho:id:mjebrofc8ns955mpdjnpakgpc4nkcqra14wqwtskp7swj46szx5x1i',
        type: 'uri',
      },
      rollReg,
    },
    template: `new return(\`rho:rchain:deployId\`), lookup(\`rho:registry:lookup\`), regCh
    in {
      lookup!(contractURI, *regCh) | for (MemberDirectory <- regCh) {
        MemberDirectory!("makeFromURI", rollReg, *return)
      }
    }`,
  },
  claimWithInbox: {
    fields: {
      myGovRevAddr: { type: 'walletRevAddr' },
      dirURI: {
        // testnet
        value: 'rho:id:mjebrofc8ns955mpdjnpakgpc4nkcqra14wqwtskp7swj46szx5x1i',
        type: 'uri',
      },
    },
    template: `new return, lookup(\`rho:registry:lookup\`), regCh in {
      lookup!(dirURI, *regCh) | for (memDir <- regCh) {
        memDir!("setup", myGovRevAddr, *return)
      }
    }`,
  },
  helloWorld: {
    template: `new world in { world!("Hello!") }`,
  },
   raviWorld: {
      template: `new ravi in { ravi!("Hello!") }`,
    },
  getRoll: {
    fields: {
      rollReg,
    },
    template: `
    new ret, ch, lookup(\`rho:registry:lookup\`) in {
      lookup!(rollReg, *ch) |
      for (@set <- ch) {
        ret!(["#define", "$roll", set.toList()])
      }
    }`,
  },
  peekKudos: {
    fields: {
      KudosReg,
    },
    template: `
    new return,
      lookup(\`rho:registry:lookup\`), ch
    in {
      lookup!(KudosReg, *ch) | for (Kudos <- ch) {
        Kudos!("peek", *ch) | for (@current <-ch ) {
          return!(["#define", "$kudos", current])
        }
      }
    }
    `,
  },
  awardKudos: {
    fields: {
      them: { type: 'string', value: '' },
      KudosReg,
    },
    template: `
    new deployId(\`rho:rchain:deployId\`),
      lookup(\`rho:registry:lookup\`), ch
    in {
      lookup!(KudosReg, *ch) | for (Kudos <- ch) {
        Kudos!("award", them, *ch) | for (@current <- ch) {
          deployId!(["#define", "$kudos", current])
        }
      }
    }
    `,
  },
  checkBalance: {
    fields: {
      myGovRevAddr: { type: 'walletRevAddr' },
    },
    template: `new return, lookup(\`rho:registry:lookup\`), RevVaultCh, vaultCh, balanceCh
    in {
      lookup!(\`rho:rchain:revVault\`, *RevVaultCh) |
      for (@(_, RevVault) <- RevVaultCh) {
        @RevVault!("findOrCreate", myGovRevAddr, *vaultCh) |
        for (@(true, vault) <- vaultCh) {
          @vault!("balance", *balanceCh) |
          for (@balance <- balanceCh) {
            return!(["#define", "$myBalance", balance])
          }
        }
      }
    }`,
  },
  newinbox: {
    fields: {
      lockerTag: { value: 'inbox', type: 'string' },
      // TODO: get contract URIs from rhopm / rho_modules
      InboxURI: {
        value: 'rho:id:ohyqkr5jmritq8chnwijpufbx3tan6d1hffiksg9qiz9rmuy97a51t',
        type: 'uri',
      },
    },
    template: `
    new deployId(\`rho:rchain:deployId\`), deployerId(\`rho:rchain:deployerId\`),
      lookup(\`rho:registry:lookup\`), insertArbitrary(\`rho:registry:insertArbitrary\`),
      inboxCh, capabilities, ret
    in {
      lookup!(InboxURI, *inboxCh) |
      for (Inbox <- inboxCh) {
        Inbox!(*capabilities) |
        for (receive, send, peek <- capabilities) {
          insertArbitrary!(*send, *ret)|
          for (@uri <- ret) {
            @[*deployerId, lockerTag]!({"inbox": *send, "receive": *receive, "peek": *peek, "URI": uri}) |
            deployId!(["#define", "$" ++ lockerTag, uri])
          }
        }
      }
    }`,
  },
  sendMail:{
    fields: {
          lockerTag: { value: 'inbox', type: 'string' },
          toInboxURI : {value: '' , type: 'uri'},
          from: { value: '', type: 'string'},
          to: { value: '', type: 'string'},
          sub: { value: 'hello', type: 'string'},
          body: { value: 'hello from ravi for hackathon 2020', type: 'string'},
      },
    template:
        `new deployId(\`rho:rchain:deployId\`), deployerId(\`rho:rchain:deployerId\`),

        lookup(\`rho:registry:lookup\`), inboxCh
        in {
            lookup!(toInboxURI, *inboxCh) |
            for (toinbox <- inboxCh) {
                toinbox!({"from": from, "to": to, "sub": sub, "body": body}, *deployId)
            }
      }`,
   },
  peekInbox: {
      fields: {
        lockerTag: { value: 'inbox', type: 'string' },
      },
      template: `new deployId(\`rho:rchain:deployId\`), deployerId(\`rho:rchain:deployerId\`), ch
      in {
        for(@{"peek": *peek, ..._} <<- @[*deployerId, lockerTag]) {
          peek!(*deployId)
        }
      }`,
    },
  checkRegistration: {
    fields: {
      myGovRevAddr: { type: 'walletRevAddr' },
      rollReg,
    },
    template: `
    new return,
      lookup(\`rho:registry:lookup\`),
      ch in
    {
      lookup!(rollReg, *ch) |
      for (@addrSet <- ch) {
        return!(["#define", "$agm2020voter", addrSet.contains(myGovRevAddr)])
      }
    }`,
  },
  newCommunity: {
    fields: {
      name: { value: '', type: 'string' },
      lockerTag: { value: 'inbox', type: 'string' },
      CommunityReg: {
        value: 'rho:id:ojkxxx95izqftspy5515fj58z58qrcc3ii9gktjcdo8d9hcqqnsuc9',
        type: 'uri',
      },
    },
    template: `
    new out, deployId(\`rho:rchain:deployId\`), deployerId(\`rho:rchain:deployerId\`),
  lookup(\`rho:registry:lookup\`), ret, ret2
in {
  lookup!(CommunityReg, *ret)|
  for ( C <- ret) {
        for(@{"inbox": *inbox, ..._} <<- @{[*deployerId, lockerTag]}) {
          C!("new", name, *inbox, *ret)|
          for (caps <- ret) {
            if (*caps != Nil) {
              inbox!(["Community", name, *caps], *deployId)
            } else {
              deployId!("newCommunity " ++ name ++ " failed")
            }
          }
        }
  }
}`,
  },
  addMember: {
    fields: {
      name: { type: 'string', value: '?' },
      themBoxReg: { type: 'uri', value: '?' },
      community: { type: 'string', value: '?' },
      lockerTag: { value: 'inbox', type: 'string' },
    },
    template: `
    new deployId(\`rho:rchain:deployId\`), deployerId(\`rho:rchain:deployerId\`), lookup(\`rho:registry:lookup\`),
    ret, boxCh, ack in {
      for(@{"peek": *peek, "inbox": *inbox, ..._} <<- @{[*deployerId, lockerTag]}) {
        lookup!(themBoxReg, *boxCh) |
        peek!("Community", community, *ret)|
        for ( @[{"admin": *admin, "read": *read, "write": *write, "grant": *grant}] <- ret; themBox <- boxCh ) {
          //stdout!("adding user")|
          admin!("add user", name, *inbox, *ret) |
          for (selfmod <- ret) {
            //stdout!("user added") |
            themBox!(["member", community, {"read": *read, "selfmod": *selfmod}], *deployId)
          }
        }
      }
    }`,
  },
  makeMint: {
    fields: {
      name: { value: 'myTokenMint', type: 'string' },
      lockerTag: { value: 'inbox', type: 'string' },
      MakeMintReg: {
        type: 'uri',
        // genesis contract
        value: 'rho:id:asysrwfgzf8bf7sxkiowp4b3tcsy4f8ombi3w96ysox4u3qdmn1wbc',
      },
    },
    template: `
    new return, lookup(\`rho:registry:lookup\`),
  deployerId(\`rho:rchain:deployerId\`),
  deployId(\`rho:rchain:deployId\`),
  ch in {
  lookup!(MakeMintReg, *ch)
  |
  for (@(nonce, *MakeMint) <- ch) {
    MakeMint!(*ch) |
    for (aMint <- ch) {
      for (@{"inbox": *inbox, ..._} <<- @{[*deployerId, lockerTag]}) {
        // send the mint to my inbox for safe keeping.
        inbox!(["Mint", name, *aMint], *deployId)
      }
    }
  }
}`,
  },
};
```

