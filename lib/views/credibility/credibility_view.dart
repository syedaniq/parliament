import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:political_think/common/components/credibility_component.dart';
import 'package:political_think/common/components/loading.dart';
import 'package:political_think/common/components/logo.dart';
import 'package:political_think/common/components/profile_icon.dart';
import 'package:political_think/common/components/zerror.dart';
import 'package:political_think/common/extensions.dart';
import 'package:political_think/common/models/credibility.dart';
import 'package:political_think/common/models/vote.dart';
import 'package:political_think/views/credibility/credibility_widget.dart';

class CredibilityView extends ConsumerStatefulWidget {
  final String pid;

  const CredibilityView({
    super.key,
    required this.pid,
  });

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _CredibilityViewViewState();
}

class _CredibilityViewViewState extends ConsumerState<CredibilityView> {
  @override
  Widget build(BuildContext context) {
    var postRef = ref.postWatch(widget.pid);
    var post = postRef.value;
    //
    Vote? vote;
    if (post != null) {
      vote = ref
          .voteWatch(
            post.pid,
            ref.user().uid,
            VoteType.credibility,
          )
          .value;
    }
    //
    var isError = postRef.hasError || !postRef.hasValue;
    var isLoading = postRef.isLoading;
    return Container(
      margin: context.blockMargin,
      padding: context.blockPadding,
      child: isLoading
          ? const Loading()
          : isError
              ? const ZError()
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(post!.primaryCredibility?.name ?? "Credibility Score",
                        style: context.h1, textAlign: TextAlign.start),
                    context.sf,
                    Row(
                      children: [
                        CredibilityWidget(
                          width: context.iconSizeXL,
                          height: context.iconSizeXL,
                          post: post,
                          showValue: false,
                          showModalOnPress: false,
                        ),
                        context.sf,
                        Expanded(
                          child: Text(
                            post.primaryCredibility?.reason ?? "",
                            overflow: TextOverflow.ellipsis,
                            maxLines: 25, // TODO: Make scrollable!
                          ),
                        ),
                      ],
                    ),
                    context.sf,
                    _infoRow(
                      context,
                      Padding(
                        padding:
                            context.blockPadding.copyWith(top: 0, bottom: 0),
                        child: Logo(size: context.iconSizeStandard),
                      ), // TODO: HACK FOR UI CHANGE TO GRID
                      post.aiCredibility?.value,
                      post.aiCredibility?.name,
                    ),
                    _infoRow(
                      context,
                      SizedBox(
                        width: context.iconSizeStandard +
                            context.blockPadding
                                .horizontal, // TODO: HACK FOR UI CHANGE TO GRID
                        child: Text(
                            post.voteCountCredibility < 1000
                                ? post.voteCountCredibility.toString()
                                : "${(post.voteCountCredibility / 1000).toStringAsFixed(1)}k",
                            style: context.am.copyWith(
                                color: post.userCredibility?.color ??
                                    context.primaryColor),
                            textAlign: TextAlign.center),
                      ),
                      post.userCredibility?.value,
                      post.userCredibility?.name,
                    ),
                    _infoRow(
                      context,
                      Padding(
                        padding:
                            context.blockPadding.copyWith(top: 0, bottom: 0),
                        child: ProfileIcon(
                            watch: false, size: context.iconSizeStandard),
                      ), // TODO: HACK FOR UI CHANGE TO GRID
                      vote?.credibility?.value,
                      vote?.credibility?.name,
                    ),
                  ],
                ),
    );
  }

  Widget _infoRow(
    BuildContext context,
    Widget first,
    double? second,
    String? third,
  ) {
    return Container(
      //margin: context.blockMargin.copyWith(top: 0, bottom: 0),
      padding: context.blockPadding,
      child: Row(
        children: [
          first,
          context.sd,
          CredibilityComponent(
            credibility: Credibility.fromValue(second ?? 0.0),
            width: context.iconSizeStandard,
            height: context.iconSizeStandard,
          ),
          context.sd,
          Expanded(
            child: Text(
              third ?? "",
              style: context.m,
            ),
          ),
        ],
      ),
    );
  }
}
