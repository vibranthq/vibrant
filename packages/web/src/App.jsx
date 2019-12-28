import {
  Editor,
  EditorState,
  ContentState,
  convertToRaw,
  convertFromRaw,
} from 'draft-js';
import * as React from 'react';
import './App.css';

function encodeContentState(contentState) {
  return btoa(JSON.stringify(convertToRaw(contentState)));
}

function decodeContentState(encoded) {
  if (!encoded) {
    return ContentState.createFromText('test');
  }
  return convertFromRaw(JSON.parse(atob(encoded)));
}

function App() {
  const [editorState, setEditorState] = React.useState(() =>
    EditorState.createWithContent(
      decodeContentState(localStorage.getItem('savedContentState')),
    ),
  );

  const editor = React.useRef(null);

  function focusEditor() {
    editor.current.focus();
  }

  function onChangeEditorState(state) {
    setEditorState(state);
  }

  React.useEffect(() => {
    focusEditor();
  }, []);

  React.useEffect(() => {
    const rawContent = encodeContentState(editorState.getCurrentContent());
    localStorage.setItem('savedContentState', rawContent);
  }, [editorState]);

  return (
    <div className="App">
      <div onClick={focusEditor}>
        <Editor
          ref={editor}
          editorState={editorState}
          onChange={onChangeEditorState}
        />
      </div>
    </div>
  );
}

export default App;
