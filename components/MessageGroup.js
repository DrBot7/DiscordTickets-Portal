/**
 * Small microservice to generate a Discord-like chat section
 * Copyright (C) 2019-present Bowser65
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react'
import marked from 'marked'
import hljs from 'highlight.js'
import Attachment from './Attachment'

const urlRegex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm
const imgRegex = /(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*\.(?:webp|jpe?g|gif|png))(?:\?([^#]*))?(?:#(.*))?/g

const lexer = new marked.Lexer()
const renderer = new marked.Renderer()

lexer.rules.hr = lexer.rules.heading = lexer.rules.list = lexer.rules.table = /^$/
marked.InlineLexer.rules.normal.strong = /^\*\*([^\s*])\*\*(?!\*)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/
lexer.rules.blockquote = /(?:^ {0,3}(?:(?:>>> ((.|\n)*))|(> (.*))))/

renderer.blockquote = (str) => {
  return `<blockquote>
  <div class='side'></div>
  <div class='content'>${str.replace(/^&gt;&gt; /, '')}</div>
</blockquote>`
}

renderer.paragraph = (str) => {
  let text = str.replace(/__([^\s_])__(?!_)|__([^\s][\s\S]*?[^\s])__(?!_)/g, '<u>$2</u>')
  const urls = text.match(urlRegex) || []
  for (const url of urls) {
    text = text.replace(url, `<a target='_blank' href='${url}'>${url}</a>`)
  }
  return text
}

export default class MessageGroup extends React.Component {
  render () {
    return <div className='message'>
      <img src={this.props.author.avatar} alt='avatar' className='avatar'/>
      <div className='details'>
        <div className='header'>
          <span className='name' data-copy-id={this.props.authorId}>{this.props.author.username}</span>
          {this.props.author.badge && <span className='badge'>{this.props.author.badge}</span>}
          <span className='time' data-timestamp={this.props.time}>{new Date(this.props.time).toGMTString()}</span>
        </div>
        <div className='contents'>
          {this.props.content.map((msg, i) => <div key={i} className='msg'>
            <div key={i} className='markup' dangerouslySetInnerHTML={{ __html: this.renderMarkdown(msg.msg) }}/>
            {this.renderAttachments(msg)}
          </div>)}
        </div>
      </div>
    </div>
  }

  renderAttachments (msg) {
    const images = [ 'webp', 'jpeg', 'jpg', 'png', 'gif' ]
    const duckduckgo = 'https://external-content.duckduckgo.com/iu/?u='
    const attachments = []
    if (msg.attachments) {
      msg.attachments.forEach((attachment, i) => {
        if (images.includes(attachment.url.split('.').pop())) {
          attachments.push(<img data-enlargable='' key={i} src={attachment.url} alt=''/>)
        } else {
          attachments.push(<Attachment key={i} {...attachment}/>)
        }
      })
    }

    const urls = (msg.msg.match(urlRegex) || []).filter(u => u.match(imgRegex))
    for (const url of urls) {
      attachments.push(<img data-enlargable='' key={url} src={duckduckgo + encodeURIComponent(url)} alt=''/>)
    }
    return attachments
  }

  renderMarkdown (str) {
    const tokens = lexer.lex(str)
    return marked.parser(tokens, {
      renderer,
      breaks: true,
      langPrefix: 'hljs ',
      highlight: (code) => hljs.highlightAuto(code).value
    })
  }
}