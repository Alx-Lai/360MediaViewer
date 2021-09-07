#### 目標 a 360video HTML element

#### Idea : valiant360(https://github.com/flimshaw/Valiant360)

#### Using Three.js

##### Usage

```html
<head>
	<script src='./index.js' type="module"></script>   
</head>
<body>
   <viewer-360 src="./assets/overpass-clip.mp4"></viewer-360>
</body>
```

##### HTML Attributes

autoplay   default:none

near  default:1

far	

| HTML Attributes | default value      |
| --------------- | ------------------ |
| autoplay        | none               |
| near            | 1                  |
| far             | 1000               |
| src             | none               |
| width           | window.innerWidth  |
| height          | window.innerHeight |
| controls        | none               |



##### Attributes

currentTime

duration

muted

##### Methods

play()

pause()
