import 'normalize.css/normalize.css';

import React from 'react';
import PropTypes from 'prop-types';

import 'rc-progress/assets/index.css';
import { Circle as Progress } from 'rc-progress';

import Configs from './config';
import UI from './ui';
import Layouts from './layouts';
import style from './pv-explorer.mcss';
import icons from './icons';
import ReaderFactory from './io/ReaderFactory';

import Controls from './controls';

const { Menu } = UI;
const { LayoutGrid } = Layouts;

const layouts = ['2D', '3D', 'Split', 'Quad'];

export default class MainView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      layout: '3D',
      overlayOpacity: 100,
      collapsed: false,
      showProgress: false,
      progressPercent: 0,
      dndVisible: false,
    };

    // main app container
    this.container = null;
    // timer id for dragleave
    this.dragTimeout = null;

    // Closure for callback
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onToggleControl = this.onToggleControl.bind(this);
    this.forceUpdate = this.forceUpdate.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDrop = this.onDrop.bind(this);
  }

  componentDidMount() {
    this.container.addEventListener('dragover', this.onDragOver);
    this.container.addEventListener('dragleave', this.onDragLeave);
    this.container.addEventListener('drop', this.onDrop);
  }

  componentWillUnmount() {
    this.container.removeEventListener('dragover', this.onDragOver);
    this.container.removeEventListener('dragleave', this.onDragLeave);
    this.container.removeEventListener('drop', this.onDrop);
  }

  onDragOver(ev) {
    const types = ev.dataTransfer.types;
    if (
      types && types instanceof Array
        ? types.indexOf('Files') !== -1
        : 'Files' in types
    ) {
      this.setState({ dndVisible: true });
      if (this.dragTimeout !== null) {
        window.clearTimeout(this.dragTimeout);
        this.dragTimeout = null;
      }
      ev.preventDefault();
    }
  }

  onDragLeave(ev) {
    this.dragTimeout = window.setTimeout(() => {
      this.setState({ dndVisible: false });
      this.dragTimeout = null;
    }, 50);
  }

  onDrop(ev) {
    ReaderFactory.loadFiles(Array.from(ev.dataTransfer.files))
      .then((readers) =>
        ReaderFactory.registerReadersToProxyManager(
          readers,
          this.props.proxyManager
        )
      )
      .then(() => this.controls.changeTabTo('pipeline'));

    this.setState({ dndVisible: false });
    ev.preventDefault();
  }

  onLayoutChange(key) {
    this.setState({ layout: key });
  }

  onToggleControl() {
    const collapsed = !this.state.collapsed;
    this.setState({ collapsed }, this.props.proxyManager.resizeAllViews);
    setTimeout(this.props.proxyManager.resizeAllViews, 500);
    setTimeout(this.forceUpdate, 500);
  }

  render() {
    let progress = null;

    if (this.state.showProgress) {
      progress = (
        <div>
          <Progress
            strokeWidth={6}
            strokeLinecap="round"
            width={50}
            percent={this.state.progressPercent}
          />
          <span className={style.progressText}>
            {this.state.progressPercent}%
          </span>
        </div>
      );
    }

    const dndClasses = [style.dndOverlay];
    if (this.state.dndVisible) {
      dndClasses.push(style.dndOverlayVisible);
    }

    return (
      <div
        className={style.vertContainer}
        ref={(r) => {
          this.container = r;
        }}
      >
        <div className={dndClasses.join(' ')}>
          <span className={style.dndOverlayText}>Drop files to open</span>
        </div>
        <div className={style.toolbar}>
          <div className={style.logo} onClick={this.onToggleControl}>
            <img alt="logo" src={icons.Logo} />
          </div>
          <Menu
            horizontal
            selectedKey={this.state.layout}
            onSelect={this.onLayoutChange}
          >
            {layouts.map((name) => (
              <Menu.Item key={name} data-name={name}>
                <img
                  alt={name}
                  className={style.toolbarIcon}
                  src={icons[`Layout${name}`]}
                />
              </Menu.Item>
            ))}
          </Menu>
          <div className={style.progressContainer}>{progress}</div>
        </div>
        <div className={style.horizContainer}>
          <div
            className={[
              style.appSideBar,
              style.sideBar,
              this.state.collapsed
                ? style.appSideBarCollapsed
                : style.appSideBarVisible,
            ].join(' ')}
          >
            <Controls
              ref={(c) => {
                this.controls = c;
              }}
              proxyManager={this.props.proxyManager}
            />
          </div>
          <div className={[style.vertContainer, style.noOverflow].join(' ')}>
            <div className={style.workspace}>
              <LayoutGrid
                proxyManager={this.props.proxyManager}
                className={style.content}
                initialConfig={Configs[this.props.mode].Layout}
                layout={this.state.layout}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

MainView.propTypes = {
  mode: PropTypes.string.isRequired,
  proxyManager: PropTypes.object.isRequired,
};

MainView.defaultProps = {};
