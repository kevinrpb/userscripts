// ==UserScript==
// @name         GitHub - Copy as Markdown
// @namespace    me.kevinrpb.userscripts
// @version      1.2
// @description  Add a button that copies a markdown link with the title of the issue.
// @author       kevinrpb
// @downloadURL  https://raw.githubusercontent.com/kevinrpb/userscripts/refs/heads/main/github-copy-as-markdown/github-copy-as-markdown.user.js
// @match        https://github.com/*/*/issues/*
// @match        https://github.com/*/*/pull/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(() => {
	const reactRootSelectors = ["div[data-target='react-app.reactRoot']"];
	const containerSelectors = [
		"div[data-component=PH_Actions] > div",
		"#partial-discussion-header > .gh-header-show > div > .gh-header-actions",
	];
	const buttonToCopySelectors = [
		"button[data-component=IconButton]:nth-last-child(2)",
		"button",
	];
	const classesToRemove = ["js-details-target", "js-title-edit-button"];
	const copyButtonId = "__gh-copy-md-button";
	const titleSelectors = ["h1[data-component=PH_Title]", "h1.gh-header-title"];

	const mdIconSVG =
		'<svg aria-hidden="true" focusable="false" class="icon-md" width="24px" height="24px" viewBox="0 0 208 128"><path style="fill:currentColor" d="M 15 0 C 6.69 0 0 6.69 0 15 L 0 113 C 0 121.31 6.69 128 15 128 L 193 128 C 201.31 128 208 121.31 208 113 L 208 15 C 208 6.69 201.31 0 193 0 L 15 0 z M 30 30 L 50 30 L 70 55 L 90 30 L 110 30 L 110 98 L 90 98 L 90 59 L 70 84 L 50 59 L 50 98 L 30 98 L 30 30 z M 145 30 L 165 30 L 165 65 L 185 65 L 155 98 L 125 65 L 145 65 L 145 30 z " /></svg>';
	const checkIconSVG =
		'<svg aria-hidden="true" focusable="false" class="octicon octicon-check" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="display: inline-block; user-select: none; vertical-align: text-bottom; overflow: visible;"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>';

	const iconTemplates = {
		md: mdIconSVG,
		check: checkIconSVG,
	};

	function _getElementBySelectors(node, selectors) {
		for (const selector of selectors) {
			const element = node.querySelector(selector);

			if (element) {
				return element;
			}
		}

		return undefined;
	}

	function _getIconSVG(name) {
		const templateID = `#_svgTemplate_${name}`;
		let template = document.querySelector(templateID);

		if (!template) {
			const htmlTemplate = iconTemplates[name];
			template = document.createElement("template");
			template.id = templateID;
			template.innerHTML = htmlTemplate;
		}

		return template.content.firstChild;
	}

	function _showCheck(button) {
		const mdSVG = button.querySelector("svg.icon-md");
		const checkSVG = _getIconSVG("check");

		button.replaceChild(checkSVG, mdSVG);

		setTimeout(() => button.replaceChild(mdSVG, checkSVG), 500);
	}

	function _parseTitle(title) {
		const parts = title.split("#");
		return [parts[1].trim(), parts[0].trim()];
	}

	function _addNewButton(container, buttonToCopy) {
		const newButton = buttonToCopy.cloneNode(false);
		const icon = _getIconSVG("md");

		for (const className of classesToRemove) {
			newButton.classList.remove(className);
		}

		newButton.id = copyButtonId;

		newButton.append(icon);
		newButton.addEventListener("click", ({ target }) => {
			const titleElement = _getElementBySelectors(document, titleSelectors);
			if (!titleElement) {
				console.error("Couldn't find the title.");
				return;
			}

			const [issueNumber, title] = _parseTitle(titleElement.textContent);
			const url = window.location;
			const md = `[#${issueNumber} - ${title}](${url})`;

			navigator.clipboard.writeText(md);
			_showCheck(newButton);
		});

		container.append(newButton);
	}

	function _tryToSetupMarkdownButton() {
		const container = _getElementBySelectors(document, containerSelectors);
		if (!container) {
			return;
		}

		if (container.querySelector(`#${copyButtonId}`)) {
			return;
		}

		const copyButton = _getElementBySelectors(container, buttonToCopySelectors);
		if (copyButton) {
			_addNewButton(container, copyButton);
		}
	}

	function _setupMutationObserver() {
		const reactRoot = _getElementBySelectors(document, reactRootSelectors);
		if (!reactRoot) {
			return;
		}

		const observer = new MutationObserver(_tryToSetupMarkdownButton);
		const config = { attributes: false, childList: true, subtree: true };
		observer.observe(reactRoot, config);
	}

	// GitHub seems to refresh the initial page, re-creating the containers and all. (hydration?)
	_setupMutationObserver();

	// Force a try after a whole second in case the refresh doesn't happen.
	setTimeout(() => {
		_tryToSetupMarkdownButton();
	}, 1000);
})();
