---
title: Writing Your Content
---

# Front Matter and Body

Nuxtent processes markdown files in two main parts: the data contained in the file's `front-matter` and all the other data contained after it. The front-matter data will be destructed, while the body of the file will be appropriately available under the `body` property.

The front matter must follow three rules:

1. It must take the form of valid `yaml`
2. It must be the first thing in the file
3. It must contained between a set of triple-dashed lines.

Here is a basic example:

```bash
---
title: Nuxtent
---

...is awesome!

```

Will result in the following data:

```
{
  title: 'Nuxtent',
  body: '<p>...is awesome!</p>'
}
```

### Reserved attributes

Since the markdown file's front-matter properties are destructured with all other top level properties, you have to be careful not to use the following reserved properties:

Here is a list of reserved attributes:

- `meta`, contains meta information about the file, such as the `fileName` and `section`.
- `date`, contains the file's date if it is a post, otherwise it defaults to the date the file was last updated.
- `permalink`, contains the file's resulting permalink.
- `body`, contains the content below the `front-matter`.

# Async Components

Nuxtent allows you to use `Vue Component` inside your markdown files.

In order to do this, you must prefix the file name with `.comp.md` so that the file can be detected by the appropriate loader.

Usage Syntax: `@[pathToComponent](componentProps)`

As you can tell, the syntax is similar to `links`, except it is prefixed by an `at sign`. This which helps `Nuxtent` detect a component so that it can dynamically import it.

For example, this markdown component:

```
@[project](name="Hello World")
```

Is converted to:

```
<Project name="Hello World") />

```

And when the file is converted into a component, will be imported as:

```
{
  Project: () => '~components/project.vue'
}
```

Now it's simple to spice up your content with demos and other sorts of components.

@[Logo]


*Note: Markdown components require additional processing and should only be used when necessary in order to keep build and load times to a minimum.*